export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  console.log('[push/subscribe] inicio');
  console.log('[push/subscribe] env — URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL, 'SERVICE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    console.log('[push/subscribe] token presente:', !!accessToken);
    if (!accessToken) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('[push/subscribe] auth — user.id:', user?.id, 'error:', authError?.message);
    if (authError || !user) return Response.json({ error: 'No autorizado', detalle: authError?.message }, { status: 401 });

    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[push/subscribe] error al parsear body:', parseErr.message);
      return Response.json({ error: 'Body inválido', detalle: parseErr.message }, { status: 400 });
    }
    const { endpoint, keys } = body;
    console.log('[push/subscribe] body — endpoint presente:', !!endpoint, 'p256dh presente:', !!keys?.p256dh, 'auth presente:', !!keys?.auth);
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: 'Datos de suscripción incompletos', recibido: { endpoint: !!endpoint, p256dh: !!keys?.p256dh, auth: !!keys?.auth } }, { status: 400 });
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, estudio_id')
      .eq('usuario', user.id)
      .single();
    console.log('[push/subscribe] perfil — data:', perfil, 'error:', perfilError?.message, 'code:', perfilError?.code);
    if (perfilError) return Response.json({ error: 'Error al obtener perfil', detalle: perfilError.message, code: perfilError.code }, { status: 500 });
    if (!perfil) return Response.json({ error: 'Perfil no encontrado', usuario_id: user.id }, { status: 404 });

    const payload = { perfil_id: perfil.id, estudio_id: perfil.estudio_id, endpoint, p256dh: keys.p256dh, auth: keys.auth };
    console.log('[push/subscribe] upsert payload — perfil_id:', perfil.id, 'estudio_id:', perfil.estudio_id, 'endpoint (primeros 60):', endpoint.slice(0, 60));

    const { data: upsertData, error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' })
      .select();
    console.log('[push/subscribe] upsert — data:', upsertData, 'error:', upsertError?.message, 'code:', upsertError?.code, 'details:', upsertError?.details);

    if (upsertError) return Response.json({ error: 'Error al guardar suscripción', detalle: upsertError.message, code: upsertError.code, details: upsertError.details }, { status: 500 });

    console.log('[push/subscribe] OK — filas afectadas:', upsertData?.length);
    return Response.json({ success: true, filas: upsertData?.length });
  } catch (err) {
    console.error('[push/subscribe] excepción no controlada:', err.message, err.stack);
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
