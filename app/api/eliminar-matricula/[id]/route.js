export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    const { data: existing } = await supabase
      .from('matriculas_abogados').select('abogado_id').eq('id', id).single();
    if (!existing || existing.abogado_id !== user.id) {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { error } = await supabase
      .from('matriculas_abogados')
      .delete()
      .eq('id', id)
      .eq('abogado_id', user.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
