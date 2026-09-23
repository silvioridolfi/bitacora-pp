import { createClient } from '@/lib/supabase/server'
import { AttendanceGrid } from '@/components/attendance-grid'
import { ExportAttendanceButton } from '@/components/export-attendance-button'
import { DailyRolesTrigger } from '@/components/daily-roles-trigger'
import { NewSessionForm } from '@/components/new-session-form'
import { PageHint } from '@/components/page-hint'
import { getCurrentProfile } from '@/lib/data'
import { todayInArgentina, grupoDeHoy } from '@/lib/timezone'
import { cn } from '@/lib/utils'
import type { Attendance, DailyRole, Grupo, Profile, Session } from '@/lib/types'

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string }>
}) {
  const { grupo: grupoParam } = await searchParams
  const { profile } = await getCurrentProfile()
  const isAdmin = profile?.is_admin ?? false

  // Un alumno no-admin solo puede ver/operar sobre su propio grupo -- se
  // ignora el ?grupo de la URL para que no pueda entrar al del otro grupo
  // ni por accidente ni a propósito (la base también lo bloquearía, pero
  // ni siquiera le mostramos la opción). El admin sigue pudiendo elegir
  // cualquiera de los dos.
  const grupo: Grupo = isAdmin
    ? grupoParam === 'Grupo 2'
      ? 'Grupo 2'
      : grupoParam === 'Grupo 1'
        ? 'Grupo 1'
        : (grupoDeHoy() ?? 'Grupo 1')
    : (profile?.grupo ?? grupoDeHoy() ?? 'Grupo 1')

  const supabase = await createClient()

  const [{ data: students }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('grupo', grupo).order('apellido_nombre'),
    supabase.from('sessions').select('*').eq('grupo', grupo).order('sesion_n', { ascending: false }),
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
  // A propósito NO cae a la sesión más reciente si no hay una de hoy --
  // si no, el panel de Roles seguiría mostrando la sesión de ayer (o de
  // la semana pasada) hasta que alguien cargue la de hoy.
  const latestSession = sessionsList.find((s) => s.fecha === today) ?? null

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
          <PageHint label="Cómo marcar la asistencia">
            Click en una celda para rotar el estado: Presente → Tardanza → Ausente → sin
            marcar.
            <br />
            Antes de las 9:00 se puede marcar Presente; después de las 12:00 la fecha de hoy
            queda bloqueada para evitar cambios accidentales.
          </PageHint>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
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
          )}
          {isAdmin && (
            <ExportAttendanceButton grupo={grupo} students={(students ?? []) as Profile[]} />
          )}
        </div>
      </div>

      <NewSessionForm grupo={grupo} />

      {latestSession ? (
        <DailyRolesTrigger
          sessionId={latestSession.id}
          sesionN={latestSession.sesion_n}
          presentStudents={presentStudents}
          roles={(dailyRolesRaw ?? []) as DailyRole[]}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Todavía no cargaste la sesión de hoy -- agregala arriba.
        </div>
      )}

      <AttendanceGrid
        students={(students ?? []) as Profile[]}
        sessions={sessionsList}
        attendance={attendanceMap}
        isAdmin={isAdmin}
      />
    </div>
  )
}
