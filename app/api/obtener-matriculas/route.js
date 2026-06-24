export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  console.log('[obtener-matriculas] iniciando');
  console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTE' : 'NO EXISTE');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'EXISTE' : 'NO EXISTE');
  try {
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    console.log('[obtener-matriculas] token presente:', !!accessToken);
    if (!accessToken) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[obtener-matriculas] faltan variables de entorno — url:', !!supabaseUrl, 'key:', !!serviceKey);
      return Response.json({ error: 'Faltan variables de entorno del servidor' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey.trim());

    console.log('[obtener-matriculas] verificando usuario con token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('[obtener-matriculas] user.id:', user?.id, 'authError:', authError?.message);
    if (authError || !user) return Response.json({ error: 'No autorizado' }, { status: 401 });

    console.log('[obtener-matriculas] query a matriculas_abogados para abogado_id:', user.id);
    const { data, error } = await supabase
      .from('matriculas_abogados')
      .select('id, jurisdiccion_id, tomo, folio, jurisdicciones(nombre)')
      .eq('abogado_id', user.id);

    console.log('[obtener-matriculas] resultado — data:', data, 'error:', error);

    if (error) {
      console.error('[obtener-matriculas] error:', error.message, error.code, error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('[obtener-matriculas] OK — filas devueltas:', data?.length);
    return Response.json({ matriculas: data || [] });
  } catch (err) {
    console.error('[obtener-matriculas] excepción:', err.message, err.code, err);
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
