import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetch-all'
import { Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { RANKING_PUNTOS } from '@/lib/status'
import { WORK_ORDER_PASOS_BLOQUEANTES } from '@/lib/types'
import type { Attendance, Grupo, Profile, TipoOT, WorkOrderEvent } from '@/lib/types'
import { cn } from '@/lib/utils'

type FinishedOrder = { id: string; tipo: TipoOT }

/**
 * Reparte los puntos de cada OT Finalizada OK entre TODOS los alumnos
 * que completaron al menos un paso del pipeline en ella (Desarme,
 * Armado, Prueba de encendido, Instalación de SO -- 'Desbloqueo' queda
 * afuera solo porque es rol fijo del FED, no un alumno). Antes el
 * puntaje completo se lo llevaba quien quedara como "responsable
 * final" de la OT, dejando afuera a quien participó en otros pasos
 * (ej. alguien que solo desarmó, si otro terminó instalando el SO).
 * El total de puntos que sale de una OT sigue siendo el mismo
 * (taller=10, territorio=15) -- solo cambia cómo se reparte.
 */
function puntosPorAlumnoDesdeOTs(
  finishedOrders: FinishedOrder[],
  events: WorkOrderEvent[],
  alumnoIds: Set<string>,
): Map<string, number> {
  const puntos = new Map<string, number>()
  const otById = new Map(finishedOrders.map((o) => [o.id, o]))

  const alumnosPorOt = new Map<string, Set<string>>()
  for (const e of events) {
    if (!e.profile_id || !alumnoIds.has(e.profile_id)) continue
    if (!WORK_ORDER_PASOS_BLOQUEANTES.includes(e.clave)) continue
    const ot = otById.get(e.work_order_id)
    if (!ot) continue
    if (!alumnosPorOt.has(ot.id)) alumnosPorOt.set(ot.id, new Set())
    alumnosPorOt.get(ot.id)!.add(e.profile_id)
  }

  for (const [otId, alumnos] of alumnosPorOt) {
    const ot = otById.get(otId)!
    const puntosOt = ot.tipo === 'taller' ? RANKING_PUNTOS.taller : RANKING_PUNTOS.territorio
    const porAlumno = puntosOt / alumnos.size
    for (const alumnoId of alumnos) {
      puntos.set(alumnoId, (puntos.get(alumnoId) ?? 0) + porAlumno)
    }
  }

  return puntos
}

function buildRanking(
  profiles: Profile[],
  finishedOrders: FinishedOrder[],
  events: WorkOrderEvent[],
  attendance: Attendance[],
) {
  const alumnoIds = new Set(profiles.map((p) => p.id))
  const puntosOtPorAlumno = puntosPorAlumnoDesdeOTs(finishedOrders, events, alumnoIds)

  // Conteos "OT taller/territorio" mostrados en la card: cuántas OT
  // finalizadas tuvieron a este alumno en al menos un paso -- ya no es
  // "de las que soy responsable final", sino "en las que participé".
  const otsPorAlumnoPorTipo = new Map<string, { taller: Set<string>; territorio: Set<string> }>()
  const otById = new Map(finishedOrders.map((o) => [o.id, o]))
  for (const e of events) {
    if (!e.profile_id || !alumnoIds.has(e.profile_id)) continue
    if (!WORK_ORDER_PASOS_BLOQUEANTES.includes(e.clave)) continue
    const ot = otById.get(e.work_order_id)
    if (!ot) continue
    if (!otsPorAlumnoPorTipo.has(e.profile_id)) {
      otsPorAlumnoPorTipo.set(e.profile_id, { taller: new Set(), territorio: new Set() })
    }
    otsPorAlumnoPorTipo.get(e.profile_id)![ot.tipo === 'taller' ? 'taller' : 'territorio'].add(
      ot.id,
    )
  }

  return profiles
    .map((p) => {
      const otsTaller = otsPorAlumnoPorTipo.get(p.id)?.taller.size ?? 0
      const otsTerritorio = otsPorAlumnoPorTipo.get(p.id)?.territorio.size ?? 0
      const asistencias = attendance.filter((a) => a.student_id === p.id)
      const presentes = asistencias.filter((a) => a.estado === 'Presente').length
      const tardanzas = asistencias.filter((a) => a.estado === 'Tardanza').length

      const puntosOT = Math.round((puntosOtPorAlumno.get(p.id) ?? 0) * 10) / 10
      const puntosAsistencia =
        presentes * RANKING_PUNTOS.presente + tardanzas * RANKING_PUNTOS.tardanza
      const total = Math.round((puntosOT + puntosAsistencia) * 10) / 10

      return {
        profile: p,
        otsTaller,
        otsTerritorio,
        presentes,
        tardanzas,
        puntosOT,
        puntosAsistencia,
        total,
      }
    })
    .sort((a, b) => b.total - a.total)
}

function RankingList({ ranking }: { ranking: ReturnType<typeof buildRanking> }) {
  return (
    <div className="flex flex-col gap-2">
      {ranking.map((r, idx) => (
        <Card key={r.profile.id} className={cn(idx === 0 && 'ring-2 ring-yellow-400/60')}>
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
                idx === 0
                  ? 'bg-status-pendiente text-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {idx === 0 ? <Trophy className="size-4" /> : idx + 1}
            </div>
            <div className="min-w-32 flex-1">
              <p className="font-medium text-foreground">{r.profile.apellido_nombre}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                Taller: <strong className="text-foreground">{r.otsTaller}</strong>
              </span>
              <span>
                Territorio: <strong className="text-foreground">{r.otsTerritorio}</strong>
              </span>
              <span>
                Presentes: <strong className="text-foreground">{r.presentes}</strong>
              </span>
              <span>
                Tardanzas:{' '}
                <strong className="text-status-derivada">{r.tardanzas}</strong>
              </span>
            </div>
            <div className="ml-auto text-right">
              <p className="font-heading text-xl font-bold text-primary">{r.total}</p>
              <p className="text-[11px] text-muted-foreground">puntos</p>
            </div>
          </CardContent>
        </Card>
      ))}
      {ranking.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Sin alumnos en este grupo.
        </p>
      )}
    </div>
  )
}

export default async function RankingPage() {
  const supabase = await createClient()

  const [{ data: students }, finishedOrders, workOrderEvents, attendance] = await Promise.all([
    supabase.from('profiles').select('*').eq('is_admin', false).order('apellido_nombre'),
    fetchAllRows<FinishedOrder>((from, to) =>
      supabase.from('work_orders').select('id, tipo').eq('estado', 'Finalizada OK').range(from, to),
    ),
    fetchAllRows<WorkOrderEvent>((from, to) =>
      supabase.from('work_order_events').select('*').range(from, to),
    ),
    fetchAllRows<Attendance>((from, to) =>
      supabase.from('attendance').select('*').range(from, to),
    ),
  ])

  const profiles = (students ?? []) as Profile[]

  const grupos: Grupo[] = ['Grupo 1', 'Grupo 2']

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          Cómo se calcula: cada OT finalizada reparte +{RANKING_PUNTOS.taller}pts (taller) o +
          {RANKING_PUNTOS.territorio}pts (territorio) entre todos los que completaron algún paso
          en ella -- no solo quien quedó como responsable final.
          <br />
          +{RANKING_PUNTOS.presente}pts por cada asistencia presente, y{' '}
          {RANKING_PUNTOS.tardanza}pts por cada tardanza. Hay un ranking por grupo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {grupos.map((g) => {
          const ranking = buildRanking(
            profiles.filter((p) => p.grupo === g),
            finishedOrders,
            workOrderEvents,
            attendance,
          )
          const totalGrupo = Math.round(ranking.reduce((acc, r) => acc + r.total, 0) * 10) / 10

          return (
            <div key={g} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-semibold text-foreground">{g}</h2>
                <div className="flex items-baseline gap-1.5 rounded-lg bg-primary/10 px-3 py-1">
                  <span className="font-heading text-lg font-bold text-primary">
                    {totalGrupo}
                  </span>
                  <span className="text-[11px] text-muted-foreground">pts del grupo</span>
                </div>
              </div>
              <RankingList ranking={ranking} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
