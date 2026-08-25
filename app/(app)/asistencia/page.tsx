import { createClient } from '@/lib/supabase/server'
import { AttendanceGrid } from '@/components/attendance-grid'
import { DailyRolesPanel } from '@/components/daily-roles-panel'
import { getCurrentProfile } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { todayInArgentina } from '@/lib/timezone'
import { cn } from '@/lib/utils'
import type { Attendance, DailyRole, Grupo, Profile, Session } from '@/lib/types'

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string }>
}) {
  const { grupo: grupoParam } = await searchParams
  const grupo: Grupo = grupoParam === 'Grupo 2' ? 'Grupo 2' : 'Grupo 1'

  const supabase = await createClient()

  const [{ data: students }, { data: sessions }, { profile }] = await Promise.all([
    supabase.from('profiles').select('*').eq('grupo', grupo).order('apellido_nombre'),
    supabase.from('sessions').select('*').eq('grupo', grupo).order('sesion_n'),
    getCurrentProfile(),
  ])

  const studentIds = (students ?? []).map((s) => s.id)
  const { data: attendanceRows } = await supabase
    .from('attendance')
    .select('*')
    .in('student_id', studentIds.length ? studentIds : ['00000000-0000-0000-0000-000000000000'])

  const attendanceMap: Record<string, Attendance['estado']> = {}
  for (const row of (attendanceRows ?? []) as Attendance[]) {
    attendanceMap[`${row.student_id}:${row.session_id}`] = row.estado
  }

  const sessionsList = (sessions ?? []) as Session[]
  const today = todayInArgentina()
  const latestSession =
    sessionsList.find((s) => s.fecha === today) ?? sessionsList[sessionsList.length - 1] ?? null
  const isActuallyToday = latestSession?.fecha === today

  const presentStudents = latestSession
    ? ((students ?? []) as Profile[]).filter((s) => {
        const estado = attendanceMap[`${s.id}:${latestSession.id}`]
        return estado === 'Presente' || estado === 'Tardanza'
      })
    : []

  const { data: dailyRolesRaw } = latestSession
    ? await supabase
        .from('daily_roles')
        .select('*, student:student_id(*)')
        .eq('session_id', latestSession.id)
    : { data: [] }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Asistencia</h1>
          <p className="text-sm text-muted-foreground">
            Click en una celda para rotar el estado: Presente → Tardanza → Ausente → sin
            marcar.
            <br />
            Antes de las 9:00 se puede marcar Presente; después de las 12:00 la fecha de hoy
            queda bloqueada para evitar cambios accidentales.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(['Grupo 1', 'Grupo 2'] as const).map((g) => (
            <a
              key={g}
              href={`/asistencia?grupo=${encodeURIComponent(g)}`}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                grupo === g
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {g}
            </a>
          ))}
        </div>
      </div>

      <AttendanceGrid
        grupo={grupo}
        students={(students ?? []) as Profile[]}
        sessions={sessionsList}
        attendance={attendanceMap}
        isAdmin={profile?.is_admin ?? false}
      />

      {latestSession && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">
            Roles -- sesión #{latestSession.sesion_n}
            {isActuallyToday ? ' (hoy)' : ` (${formatDate(latestSession.fecha)})`}
          </p>
          <DailyRolesPanel
            sessionId={latestSession.id}
            presentStudents={presentStudents}
            roles={(dailyRolesRaw ?? []) as DailyRole[]}
          />
        </div>
      )}
    </div>
  )
}
