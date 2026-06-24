export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
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

    const { data, error } = await supabase
      .from('matriculas_abogados')
      .select('id, jurisdiccion_id, tomo, folio, jurisdicciones(nombre)')
      .eq('abogado_id', user.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ matriculas: data || [] });
  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
