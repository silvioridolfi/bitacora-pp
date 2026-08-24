import { createClient } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { RANKING_PUNTOS } from '@/lib/status'
import type { Attendance, Grupo, Profile, WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'

function buildRanking(
  profiles: Profile[],
  orders: Pick<WorkOrder, 'id' | 'tipo' | 'estado' | 'responsable_id'>[],
  attendance: Attendance[],
) {
  return profiles
    .map((p) => {
      const ots = orders.filter((o) => o.responsable_id === p.id)
      const otsTaller = ots.filter((o) => o.tipo === 'taller').length
      const otsTerritorio = ots.filter((o) => o.tipo === 'territorio').length
      const asistencias = attendance.filter((a) => a.student_id === p.id)
      const presentes = asistencias.filter((a) => a.estado === 'Presente').length
      const tardanzas = asistencias.filter((a) => a.estado === 'Tardanza').length

      const puntosOT =
        otsTaller * RANKING_PUNTOS.taller + otsTerritorio * RANKING_PUNTOS.territorio
      const puntosAsistencia =
        presentes * RANKING_PUNTOS.presente + tardanzas * RANKING_PUNTOS.tardanza
      const total = puntosOT + puntosAsistencia

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

  const [{ data: students }, { data: workOrders }, { data: attendanceRows }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('is_admin', false).order('apellido_nombre'),
      supabase
        .from('work_orders')
        .select('id, tipo, estado, responsable_id')
        .eq('estado', 'Finalizada OK'),
      supabase.from('attendance').select('*'),
    ])

  const profiles = (students ?? []) as Profile[]
  const orders = (workOrders ?? []) as Pick<
    WorkOrder,
    'id' | 'tipo' | 'estado' | 'responsable_id'
  >[]
  const attendance = (attendanceRows ?? []) as Attendance[]

  const grupos: Grupo[] = ['Grupo 1', 'Grupo 2']

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          Cómo se calcula: +{RANKING_PUNTOS.taller}pts por cada OT de taller finalizada, +
          {RANKING_PUNTOS.territorio}pts por cada OT de territorio finalizada.
          <br />
          +{RANKING_PUNTOS.presente}pts por cada asistencia presente, y{' '}
          {RANKING_PUNTOS.tardanza}pts por cada tardanza. Hay un ranking por grupo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {grupos.map((g) => {
          const ranking = buildRanking(
            profiles.filter((p) => p.grupo === g),
            orders,
            attendance,
          )
          const totalGrupo = ranking.reduce((acc, r) => acc + r.total, 0)

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
