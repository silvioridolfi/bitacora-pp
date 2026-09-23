import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data'
import { fetchAllRows } from '@/lib/supabase/fetch-all'
import { attendanceByKeyFrom, attendanceStatsFor, buildRanking, type FinishedOrder } from '@/lib/student-stats'
import { WorkOrderCard } from '@/components/work-order-card'
import { WorkOrderForm } from '@/components/work-order-form'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedNumber } from '@/components/animated-number'
import type { Attendance, Profile, School, Session, WorkOrder, WorkOrderEvent } from '@/lib/types'

export default async function AlumnoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

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
    { profile: currentProfile },
    { data: profiles },
    { data: schools },
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
    getCurrentProfile(),
    supabase.from('profiles').select('*').order('apellido_nombre'),
    supabase.from('schools').select('*').order('nombre'),
  ])

  const groupmates = (groupmatesData ?? []) as Profile[]
  const sessions = (sessionsData ?? []) as Session[]

  const ranking = buildRanking(groupmates, finishedOrders, workOrderEvents, attendance)
  const rankingEntry = ranking.find((r) => r.profile.id === id)
  const puestoEnGrupo = ranking.findIndex((r) => r.profile.id === id) + 1

  const attStats = attendanceStatsFor(id, sessions, attendanceByKeyFrom(attendance))

  // OTs en las que participó -- no solo las Finalizada OK que cuentan
  // para el ranking, también las Derivadas y las que sigan en curso.
  const workOrderIds = [
    ...new Set(
      workOrderEvents.filter((e) => e.profile_id === id).map((e) => e.work_order_id),
    ),
  ]

  const { data: ordersData } =
    workOrderIds.length > 0
      ? await supabase
          .from('work_orders')
          .select(
            '*, equipment:equipment_id(*), responsable:responsable_id(*), responsable_original:responsable_original_id(*), last_edited_by_profile:last_edited_by(*), session:session_id(*), school:school_id(*), work_order_events(*, profile:profile_id(*))',
          )
          .in('id', workOrderIds)
          .order('fecha', { ascending: false })
      : { data: [] }

  const orders = (ordersData ?? []) as unknown as WorkOrder[]
  const finalizadas = orders.filter((o) => o.estado === 'Finalizada OK').length
  const derivadas = orders.filter((o) => o.estado === 'Derivada').length

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/ranking"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al ranking
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {student.apellido_nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          {student.grupo ?? 'Sin grupo'}
          {puestoEnGrupo > 0 && ` · #${puestoEnGrupo} en el ranking de su grupo`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">Puntos totales</span>
            <span className="font-heading text-2xl font-bold text-primary">
              <AnimatedNumber
                value={rankingEntry?.total ?? 0}
                decimals={(rankingEntry?.total ?? 0) % 1 !== 0 ? 1 : 0}
              />
            </span>
            <span className="text-[11px] text-muted-foreground">
              {rankingEntry?.puntosOT ?? 0} por OTs · {rankingEntry?.puntosAsistencia ?? 0} por
              asistencia
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">% Asistencia</span>
            <span className="font-heading text-2xl font-bold text-foreground">
              <AnimatedNumber value={attStats.porcentaje} suffix="%" />
            </span>
            <span className="text-[11px] text-muted-foreground">
              {attStats.presentes} presentes · {attStats.tardanzas} tardanzas ·{' '}
              {attStats.ausentes} ausentes
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">Horas acreditadas</span>
            <span className="font-heading text-2xl font-bold text-foreground">
              <AnimatedNumber value={attStats.horas} suffix="hs" />
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">OTs finalizadas</span>
            <span className="font-heading text-2xl font-bold text-foreground">
              <AnimatedNumber value={finalizadas} />
            </span>
            <span className="text-[11px] text-muted-foreground">
              {rankingEntry?.otsTaller ?? 0} taller · {rankingEntry?.otsTerritorio ?? 0}{' '}
              territorio
              {derivadas > 0 && ` · ${derivadas} derivadas`}
            </span>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-bold text-foreground">
          OTs en las que participó ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no completó ningún paso en una OT.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((wo) => (
              <WorkOrderForm
                key={wo.id}
                tipo={wo.tipo}
                profiles={(profiles ?? []) as Profile[]}
                schools={(schools ?? []) as School[]}
                workOrder={wo}
                trigger={
                  <WorkOrderCard
                    workOrder={wo}
                    isAdmin={currentProfile?.is_admin ?? false}
                    currentProfileId={currentProfile?.id ?? null}
                  />
                }
                isAdmin={currentProfile?.is_admin ?? false}
                currentProfileId={currentProfile?.id ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
