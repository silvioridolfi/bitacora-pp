import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, CalendarCheck, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data'
import { fetchAllRows } from '@/lib/supabase/fetch-all'
import { attendanceByKeyFrom, attendanceStatsFor, buildRanking, type FinishedOrder } from '@/lib/student-stats'
import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedNumber } from '@/components/animated-number'
import { cn } from '@/lib/utils'
import type { Attendance, Profile, Session, WorkOrderEstado, WorkOrderEvent } from '@/lib/types'

export default async function AlumnoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { profile: currentProfile } = await getCurrentProfile()

  // Perfil privado: cada alumno solo ve el suyo propio; el admin puede
  // ver cualquiera (mismo criterio que /usuarios).
  if (!currentProfile) redirect('/auth/login')
  if (!currentProfile.is_admin && currentProfile.id !== id) {
    redirect(`/alumnos/${currentProfile.id}`)
  }

  const { data: studentData } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  const student = studentData as Profile | null
  if (!student) notFound()
  // Esta página es un perfil de alumno (participación, puntos, asistencia)
  // -- no tiene sentido para una cuenta admin, que no compite en el
  // ranking ni tiene grupo asignado.
  if (student.is_admin) redirect('/usuarios')

  const [
    { data: groupmatesData },
    finishedOrders,
    workOrderEvents,
    attendance,
    { data: sessionsData },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('grupo', student.grupo).eq('is_admin', false),
    fetchAllRows<FinishedOrder>((from, to) =>
      supabase.from('work_orders').select('id, tipo').eq('estado', 'Finalizada OK').range(from, to),
    ),
    fetchAllRows<WorkOrderEvent>((from, to) =>
      supabase.from('work_order_events').select('*').range(from, to),
    ),
    fetchAllRows<Attendance>((from, to) =>
      supabase.from('attendance').select('*').range(from, to),
    ),
    supabase.from('sessions').select('*').eq('grupo', student.grupo),
  ])

  const groupmates = (groupmatesData ?? []) as Profile[]
  const sessions = (sessionsData ?? []) as Session[]

  const ranking = buildRanking(groupmates, finishedOrders, workOrderEvents, attendance)
  const rankingEntry = ranking.find((r) => r.profile.id === id)
  const puestoEnGrupo = ranking.findIndex((r) => r.profile.id === id) + 1

  const attStats = attendanceStatsFor(id, sessions, attendanceByKeyFrom(attendance))

  // OTs en las que participó -- liviano (solo id/tipo/estado, sin los
  // joins de equipo/responsable/etc.) porque acá solo hace falta contar
  // por estado; el detalle completo vive en /alumnos/[id]/ordenes.
  const workOrderIds = [
    ...new Set(workOrderEvents.filter((e) => e.profile_id === id).map((e) => e.work_order_id)),
  ]
  const { data: ordersLightData } =
    workOrderIds.length > 0
      ? await supabase.from('work_orders').select('id, estado').in('id', workOrderIds)
      : { data: [] }
  const ordersLight = (ordersLightData ?? []) as { id: string; estado: WorkOrderEstado }[]
  const finalizadas = ordersLight.filter((o) => o.estado === 'Finalizada OK').length
  const derivadas = ordersLight.filter((o) => o.estado === 'Derivada').length

  const estadoCounts = Object.keys(WORK_ORDER_STATUS_STYLE).map((estado) => ({
    estado: estado as WorkOrderEstado,
    count: ordersLight.filter((o) => o.estado === estado).length,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {student.apellido_nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          {student.grupo ?? 'Sin grupo'}
          {puestoEnGrupo > 0 && ` · #${puestoEnGrupo} en el ranking de su grupo`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/ranking">
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Trophy className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Puntos totales</span>
                <span className="font-heading text-3xl font-bold text-primary">
                  <AnimatedNumber
                    value={rankingEntry?.total ?? 0}
                    decimals={(rankingEntry?.total ?? 0) % 1 !== 0 ? 1 : 0}
                  />
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {rankingEntry?.puntosOT ?? 0} por OTs · {rankingEntry?.puntosAsistencia ?? 0} por
                  asistencia
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/asistencia">
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-status-presente/10 text-status-presente">
                <CalendarCheck className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">% Asistencia</span>
                <span className="font-heading text-3xl font-bold text-foreground">
                  <AnimatedNumber value={attStats.porcentaje} suffix="%" />
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {attStats.presentes} presentes · {attStats.tardanzas} tardanzas ·{' '}
                  {attStats.ausentes} ausentes
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/asistencia">
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Clock className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Horas acreditadas</span>
                <span className="font-heading text-3xl font-bold text-foreground">
                  <AnimatedNumber value={attStats.horas} suffix="hs" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/alumnos/${id}/ordenes?estado=${encodeURIComponent('Finalizada OK')}`}>
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-status-finalizada/10 text-status-finalizada">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">OTs finalizadas</span>
                <span className="font-heading text-3xl font-bold text-foreground">
                  <AnimatedNumber value={finalizadas} />
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {rankingEntry?.otsTaller ?? 0} taller · {rankingEntry?.otsTerritorio ?? 0}{' '}
                  territorio
                  {derivadas > 0 && ` · ${derivadas} derivadas`}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="border-t border-border pt-6">
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Distribución por estado ({ordersLight.length} OT en total)
              </h2>
              <Link
                href={`/alumnos/${id}/ordenes`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Ver detalle →
              </Link>
            </div>
            {ordersLight.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no completó ningún paso en una OT.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {estadoCounts.map(({ estado, count }, idx) => {
                  const style = WORK_ORDER_STATUS_STYLE[estado]
                  return (
                    <Link
                      key={estado}
                      href={`/alumnos/${id}/ordenes?estado=${encodeURIComponent(estado)}`}
                      className={cn(
                        'flex animate-in flex-col gap-1 rounded-lg border p-4 fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500 transition-opacity hover:opacity-80',
                        style.bg,
                        style.border,
                      )}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <span className={cn('text-sm font-medium leading-tight', style.text)}>
                        {style.label}
                      </span>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        <AnimatedNumber value={count} />
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
