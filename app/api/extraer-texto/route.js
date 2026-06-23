export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { archivo_url, escrito_id, access_token } = await request.json();

    if (!archivo_url || !escrito_id) {
      return Response.json({ error: 'Faltan parámetros: archivo_url y escrito_id son requeridos' }, { status: 400 });
    }

    const ext = archivo_url.split('?')[0].split('.').pop().toLowerCase();

    const fileRes = await fetch(archivo_url);
    if (!fileRes.ok) {
      return Response.json({ error: `No se pudo descargar el archivo (HTTP ${fileRes.status})` }, { status: 502 });
    }
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    let texto_extraido = '';

    if (ext === 'pdf') {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      texto_extraido = text || '';
    } else if (ext === 'doc' || ext === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      texto_extraido = result.value || '';
    } else {
      return Response.json({ error: `Formato no soportado: .${ext}` }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return Response.json({ error: 'Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY en el servidor' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceKey.trim());
    const jwtPayload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64').toString());
    console.log('[extraer-texto] role en el JWT:', jwtPayload.role);

    const { data: updateData, error: updateError } = await supabase
      .from('escritos_ejemplo')
      .update({ texto_extraido })
      .eq('id', escrito_id)
      .select('id');

    console.log('[extraer-texto] update resultado — error:', updateError?.message ?? null, '| filas afectadas:', updateData?.length ?? 0);

    if (updateError) {
      return Response.json({ error: 'Error al guardar en la base de datos: ' + updateError.message }, { status: 500 });
    }
    if (!updateData || updateData.length === 0) {
      return Response.json({ error: `El UPDATE no afectó ninguna fila. Verificá que el escrito_id "${escrito_id}" exista en la tabla.` }, { status: 500 });
    }

    return Response.json({ success: true, texto_extraido });
  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
