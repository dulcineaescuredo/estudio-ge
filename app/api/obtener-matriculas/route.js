export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  console.log('[obtener-matriculas] iniciando');
  try {
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    console.log('[obtener-matriculas] token presente:', !!accessToken);
    if (!accessToken) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[obtener-matriculas] supabaseUrl existe:', !!supabaseUrl);
    console.log('[obtener-matriculas] serviceKey existe:', !!serviceKey, 'longitud:', serviceKey?.length);

    if (!supabaseUrl || !serviceKey) {
      console.error('[obtener-matriculas] faltan variables de entorno');
      return Response.json({ error: 'Faltan variables de entorno del servidor' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey.trim());

    console.log('[obtener-matriculas] verificando usuario');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('[obtener-matriculas] user:', user?.id, 'authError:', authError?.message);
    if (authError || !user) return Response.json({ error: 'No autorizado' }, { status: 401 });

    console.log('[obtener-matriculas] query a BD para abogado_id:', user.id);
    const { data, error } = await supabase
      .from('matriculas_abogados')
      .select('id, jurisdiccion_id, tomo, folio, jurisdicciones(nombre)')
      .eq('abogado_id', user.id);

    console.log('[obtener-matriculas] resultado — data:', data, 'error:', error);

    if (error) {
      console.error('[obtener-matriculas] error de Supabase:', error.message, error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('[obtener-matriculas] OK, filas:', data?.length);
    return Response.json({ matriculas: data || [] });
  } catch (err) {
    console.error('[obtener-matriculas] excepción:', err.message, err);
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
