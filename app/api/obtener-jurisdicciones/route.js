export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function GET() {
  console.log('[obtener-jurisdicciones] iniciando');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[obtener-jurisdicciones] supabaseUrl existe:', !!supabaseUrl);
    console.log('[obtener-jurisdicciones] serviceKey existe:', !!serviceKey, 'longitud:', serviceKey?.length);

    if (!supabaseUrl || !serviceKey) {
      console.error('[obtener-jurisdicciones] faltan variables de entorno');
      return Response.json({ error: 'Faltan variables de entorno del servidor' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey.trim());

    console.log('[obtener-jurisdicciones] ejecutando query a BD');
    const { data, error } = await supabase
      .from('jurisdicciones')
      .select('id, nombre')
      .order('nombre');

    console.log('[obtener-jurisdicciones] resultado — data:', data, 'error:', error);

    if (error) {
      console.error('[obtener-jurisdicciones] error de Supabase:', error.message, error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('[obtener-jurisdicciones] OK, filas:', data?.length);
    return Response.json({ jurisdicciones: data || [] });
  } catch (err) {
    console.error('[obtener-jurisdicciones] excepción:', err.message, err);
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
