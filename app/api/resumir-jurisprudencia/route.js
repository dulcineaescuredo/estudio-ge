export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return Response.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('?')[0].split('.').pop().toLowerCase();

    let texto = '';
    if (ext === 'pdf') {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      texto = text || '';
    } else if (ext === 'doc' || ext === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      texto = result.value || '';
    } else {
      return Response.json({ error: `Formato no soportado: .${ext}. Usá PDF o DOCX.` }, { status: 400 });
    }

    if (!texto.trim()) {
      return Response.json({ error: 'No se pudo extraer texto del archivo' }, { status: 422 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Falta la variable de entorno ANTHROPIC_API_KEY' }, { status: 500 });
    }

    const prompt = `De la siguiente sentencia/fallo, extraé únicamente la parte relevante que se podría citar como jurisprudencia en una demanda (el holding o fundamento central). Máximo 4 oraciones, en español, sin agregar comentario propio.\n\nTexto del fallo:\n${texto}`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
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
    const resumen = anthropicData.content?.[0]?.text || '';

    return Response.json({ resumen });

  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
