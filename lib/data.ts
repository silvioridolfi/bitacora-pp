import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { DailyRoleName, Profile } from '@/lib/types'

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

/**
 * Roles del día asignados hoy, agrupados por alumno -- toma la sesión
 * más reciente de cada grupo (Grupo 1 y Grupo 2) y arma un mapa
 * profile_id -> lista de roles. Usado para mostrar el badge de rol en
 * las cards de OT (Tablero/Taller/Territorio), sin condicionar nada.
 */
export async function getTodayRolesByProfile(): Promise<Record<string, DailyRoleName[]>> {
  const supabase = await createClient()

  const grupos = ['Grupo 1', 'Grupo 2'] as const
  const latestSessions = await Promise.all(
    grupos.map((g) =>
      supabase
        .from('sessions')
        .select('id')
        .eq('grupo', g)
        .order('sesion_n', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
  )

  const sessionIds = latestSessions
    .map((r) => r.data?.id)
    .filter((id): id is string => Boolean(id))

  if (sessionIds.length === 0) return {}

  const { data } = await supabase
    .from('daily_roles')
    .select('student_id, rol')
    .in('session_id', sessionIds)

  const map: Record<string, DailyRoleName[]> = {}
  for (const row of data ?? []) {
    const list = map[row.student_id] ?? []
    list.push(row.rol as DailyRoleName)
    map[row.student_id] = list
  }
  return map
}
