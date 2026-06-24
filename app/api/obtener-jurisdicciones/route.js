export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

export async function GET() {
  console.log('[obtener-jurisdicciones] iniciando');
  console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTE' : 'NO EXISTE');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'EXISTE' : 'NO EXISTE');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[obtener-jurisdicciones] faltan variables de entorno — url:', !!supabaseUrl, 'key:', !!serviceKey);
      return Response.json({ error: 'Faltan variables de entorno del servidor' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey.trim());

    console.log('[obtener-jurisdicciones] ejecutando query a tabla jurisdicciones');
    const { data, error } = await supabase
      .from('jurisdicciones')
      .select('id, nombre')
      .order('nombre');

    console.log('[obtener-jurisdicciones] resultado — data:', data, 'error:', error);

    if (error) {
      console.error('[obtener-jurisdicciones] error:', error.message, error.code, error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('[obtener-jurisdicciones] OK — filas devueltas:', data?.length);
    return Response.json({ jurisdicciones: data || [] });
  } catch (err) {
    console.error('[obtener-jurisdicciones] excepción:', err.message, err.code, err);
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
