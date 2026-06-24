export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
    );

    const { data, error } = await supabase
      .from('jurisdicciones')
      .select('id, nombre')
      .order('nombre');

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ jurisdicciones: data || [] });
  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
