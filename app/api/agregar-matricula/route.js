export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const { jurisdiccion_id, tomo_matricula, folio_matricula } = await request.json();
    if (!jurisdiccion_id || !tomo_matricula || !folio_matricula) {
      return Response.json({ error: 'Completá todos los campos.' }, { status: 400 });
    }

    const { data: jur } = await supabase.from('jurisdicciones').select('id').eq('id', jurisdiccion_id).single();
    if (!jur) return Response.json({ error: 'Jurisdicción no válida.' }, { status: 400 });

    const { error } = await supabase.from('matriculas_abogados').insert({
      abogado_id: user.id,
      jurisdiccion_id,
      tomo: tomo_matricula,
      folio: folio_matricula,
    });

    if (error) {
      if (error.code === '23505') return Response.json({ error: 'Ya tenés una matrícula registrada para esa jurisdicción.' }, { status: 409 });
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
