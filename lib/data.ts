import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

/**
 * Perfil de negocio (public.profiles) del usuario autenticado actual.
 * Puede ser null si el usuario todavía no tiene fila vinculada.
 */
export async function getCurrentProfile(): Promise<{
  profile: Profile | null
  email: string | null
}> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return { profile: null, email: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return { profile: (profile as Profile) ?? null, email: user.email ?? null }
}
