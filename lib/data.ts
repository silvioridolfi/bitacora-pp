import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { todayInArgentina } from '@/lib/timezone'
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
 * Roles del día asignados hoy, agrupados por alumno -- busca, para cada
 * grupo, la sesión cuya FECHA sea la de hoy (no simplemente "la más
 * reciente por número"), para que una sesión de prueba cargada fuera de
 * orden nunca termine contaminando el badge. Si un grupo no tiene sesión
 * con fecha de hoy, no aparece nada para ese grupo. Usado para mostrar
 * el badge de rol en las cards de OT (Tablero/Taller/Territorio), sin
 * condicionar nada.
 */
export async function getTodayRolesByProfile(): Promise<Record<string, DailyRoleName[]>> {
  const supabase = await createClient()
  const today = todayInArgentina()

  const grupos = ['Grupo 1', 'Grupo 2'] as const
  const todaySessions = await Promise.all(
    grupos.map((g) =>
      supabase.from('sessions').select('id').eq('grupo', g).eq('fecha', today).maybeSingle(),
    ),
  )

  const sessionIds = todaySessions
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
