import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente con permisos de administrador total (bypassea RLS). Solo se usa
 * en Server Actions, nunca en el cliente/navegador. Requiere la variable
 * de entorno SUPABASE_SERVICE_ROLE_KEY (distinta de la anon key pública
 * que ya usa el resto de la app) -- se consigue en el dashboard de
 * Supabase: Project Settings > API Keys > service_role.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      'Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.',
    )
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
