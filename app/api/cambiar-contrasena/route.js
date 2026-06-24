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

    const { contrasena_actual, contrasena_nueva } = await request.json();
    if (!contrasena_actual || !contrasena_nueva) {
      return Response.json({ error: 'Faltan parámetros.' }, { status: 400 });
    }
    if (contrasena_nueva.length < 6) {
      return Response.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email: user.email,
      password: contrasena_actual,
    });
    if (signInError) {
      return Response.json({ error: 'La contraseña actual es incorrecta.' }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: contrasena_nueva,
    });
    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
