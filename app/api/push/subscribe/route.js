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

    const { endpoint, keys } = await request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: 'Datos de suscripción incompletos' }, { status: 400 });
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, estudio_id')
      .eq('usuario', user.id)
      .single();

    if (!perfil) return Response.json({ error: 'Perfil no encontrado' }, { status: 404 });

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { perfil_id: perfil.id, estudio_id: perfil.estudio_id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'endpoint' }
      );

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
