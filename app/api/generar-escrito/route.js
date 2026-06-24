export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { tipo, cliente_id, expediente_id, instrucciones, instrucciones_demanda, abogados_interponen } = await request.json();

    if (!tipo || !cliente_id || !expediente_id) {
      return Response.json({ error: 'Faltan parámetros: tipo, cliente_id y expediente_id son requeridos' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Falta la variable de entorno ANTHROPIC_API_KEY' }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[generar-escrito] service key existe:', !!serviceKey, 'longitud:', serviceKey?.length);
    console.log('[generar-escrito] service key trim longitud:', serviceKey?.trim().length, 'primeros 4 chars:', JSON.stringify(serviceKey?.slice(0,4)), 'últimos 4 chars:', JSON.stringify(serviceKey?.slice(-4)));
    const jwtPayload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64').toString());
    console.log('[generar-escrito] role en el JWT:', jwtPayload.role);
    if (!serviceKey) {
      return Response.json({ error: 'Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY en el servidor' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceKey.trim());

    console.log('[generar-escrito] tipo recibido:', JSON.stringify(tipo));

    const { data: todosLosTipos } = await supabase
      .from('escritos_ejemplo')
      .select('tipo, texto_extraido')
      .not('texto_extraido', 'is', null);
    console.log('[generar-escrito] tipos con texto_extraido en DB:', JSON.stringify((todosLosTipos || []).map(r => r.tipo)));

    const { data: ejemplos, error: ejError } = await supabase
      .from('escritos_ejemplo')
      .select('texto_extraido, archivo_nombre')
      .eq('tipo', tipo)
      .not('texto_extraido', 'is', null);

    if (ejError) {
      return Response.json({ error: 'Error al consultar ejemplos: ' + ejError.message }, { status: 500 });
    }
    if (!ejemplos || ejemplos.length === 0) {
      return Response.json({
        error: `No hay ejemplos con texto extraído para el tipo "${tipo}". Subí al menos un archivo en esa carpeta y extraé su texto antes de generar un draft.`
      }, { status: 422 });
    }

    const { data: expediente, error: expError } = await supabase
      .from('expedientes')
      .select('*')
      .eq('id', expediente_id)
      .single();

    if (expError || !expediente) {
      return Response.json({ error: 'No se encontró el expediente' }, { status: 404 });
    }

    const { data: cliente, error: cliError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', cliente_id)
      .single();

    if (cliError || !cliente) {
      return Response.json({ error: 'No se encontró el cliente' }, { status: 404 });
    }

    const nombreCliente = cliente.apellido && cliente.nombre_pila
      ? `${cliente.apellido}, ${cliente.nombre_pila}`
      : (cliente.apellido || cliente.nombre_pila || cliente.nombre || '');

    const ejemplosTexto = ejemplos.map((e, i) =>
      `--- EJEMPLO ${i + 1}${e.archivo_nombre ? ` (${e.archivo_nombre})` : ''} ---\n${e.texto_extraido}`
    ).join('\n\n');

    const datosExpediente = [
      expediente.caratula && `Carátula: ${expediente.caratula}`,
      expediente.numero && `Número: ${expediente.numero}`,
      expediente.juzgado && `Juzgado: ${expediente.juzgado}`,
      expediente.tipo_proceso && `Tipo de proceso: ${expediente.tipo_proceso}`,
      expediente.rol && `Rol de la parte: ${expediente.rol}`,
      expediente.fuero && `Fuero: ${expediente.fuero}`,
    ].filter(Boolean).join('\n');

    let interponentesSeccion = '';
    if (tipo === 'Demanda' && Array.isArray(abogados_interponen) && abogados_interponen.length > 0) {
      const { data: abogadosData } = await supabase.from('perfiles').select('id, nombre, rol').in('id', abogados_interponen);
      const { data: matriculasData } = await supabase.from('matriculas_abogados').select('abogado_id, tomo, folio, jurisdicciones(nombre)').in('abogado_id', abogados_interponen);
      const lineas = (abogadosData || []).map(a => {
        const mats = (matriculasData || []).filter(m => m.abogado_id === a.id);
        const matTexto = mats.map(m => `${m.jurisdicciones?.nombre}: Tomo ${m.tomo}, Folio ${m.folio}`).join('; ');
        return `- ${(a.nombre || '').toUpperCase()}, ${a.rol || 'abogado/a'}${matTexto ? ` (${matTexto})` : ''}`;
      });
      if (lineas.length > 0) {
        interponentesSeccion = `## Interponen la demanda:\n${lineas.join('\n')}`;
      }
    }

    let hechosSeccion = '';
    if (tipo === 'Demanda' && instrucciones_demanda) {
      const d = instrucciones_demanda;
      const lineas = [
        d.tipo_proceso && `Tipo de proceso: ${d.tipo_proceso}`,
        d.personeria && `Personería: ${d.personeria}`,
        d.objeto && `Objeto: ${d.objeto}`,
        d.hechos && `Hechos: ${d.hechos}`,
        d.fundamento_legal && `Fundamento legal: ${d.fundamento_legal}`,
        d.peticion && `Petición: ${d.peticion}`,
        d.prueba && `Prueba ofrecida: ${d.prueba}`,
        d.danio_moral
          ? `Daño moral: Sí, con el siguiente fundamento: ${d.danio_moral_detalle || '(sin detalle)'}`
          : 'Daño moral: No se reclama',
        d.jurisprudencia && d.jurisprudencia_fallo
          ? `Jurisprudencia citada: Fallo: ${d.jurisprudencia_fallo}${d.jurisprudencia_extracto ? ` — Parte relevante: ${d.jurisprudencia_extracto}` : ''}`
          : null,
        d.comentarios_adicionales && `Comentarios adicionales: ${d.comentarios_adicionales}`,
      ].filter(Boolean);
      if (lineas.length > 0) {
        hechosSeccion = `## Hechos del caso (información provista por el usuario — esta es la fuente de verdad sobre lo ocurrido, no inventar hechos adicionales)\n${lineas.join('\n')}`;
      }
    }

    const prompt = `Sos un asistente legal especializado en redacción de escritos judiciales argentinos. Tu tarea es redactar un escrito judicial de tipo "${tipo}" completo, listo para revisar y editar. No escribas un resumen ni un esquema: redactá el escrito en forma íntegra, con el encabezado, cuerpo y cierre correspondientes.
${hechosSeccion ? `\n${hechosSeccion}\n` : ''}${interponentesSeccion ? `\n${interponentesSeccion}\nLos interponentes mencionados arriba son los abogados que interponen esta demanda. Redactá la cláusula de interpone incluyendo sus nombres completos, roles, matrículas y jurisdicciones de forma que se lea natural en un escrito judicial.\n` : ''}
Basate estrictamente en el estilo, la estructura y las convenciones que se observan en los siguientes ejemplos:

${ejemplosTexto}

DATOS DEL EXPEDIENTE:
${datosExpediente}

DATOS DEL CLIENTE/PARTE:
${nombreCliente}
${instrucciones ? `\nINSTRUCCIONES ADICIONALES DEL ABOGADO:\n${instrucciones}` : ''}

Redactá ahora el escrito completo:`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errData = await anthropicRes.json().catch(() => ({}));
      return Response.json({
        error: `Error de la API de Claude: ${errData.error?.message || anthropicRes.statusText}`
      }, { status: 502 });
    }

    const anthropicData = await anthropicRes.json();
    const draft = anthropicData.content?.[0]?.text || '';

    return Response.json({ success: true, draft });

  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
