import { headers } from 'next/headers'
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
  // Interruptor temporal para pruebas: simula una sesión de administrador
  // sin necesidad de iniciar sesión. Volver a poner en "false" (o eliminar
  // la variable) para reactivar el sistema de login.
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return {
      email: 'pruebas@dte.local',
      profile: {
        id: 'test-mode-admin',
        apellido_nombre: 'Modo de pruebas (sin login)',
        grupo: null,
        is_admin: true,
        dias: null,
        created_at: new Date().toISOString(),
      },
    }
  }

  // El middleware ya validó la sesión (auth.getUser()) y consultó el
  // perfil para esta misma request -- si esos headers están presentes,
  // los reusamos en vez de repetir esas dos idas y vueltas a Supabase.
  const headerList = await headers()
  const headerUserId = headerList.get('x-user-id')
  const headerEmail = headerList.get('x-user-email')
  const headerProfileJson = headerList.get('x-profile-json')

  if (headerUserId) {
    let profile: Profile | null = null
    if (headerProfileJson) {
      try {
        profile = JSON.parse(decodeURIComponent(headerProfileJson)) as Profile
      } catch {
        profile = null
      }
    }
    return { profile, email: headerEmail || null }
  }

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
