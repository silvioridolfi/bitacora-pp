import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data'
import { fetchAllRows } from '@/lib/supabase/fetch-all'
import { Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedNumber } from '@/components/animated-number'
import { RankingCelebration, ProbarCelebracionButton } from '@/components/ranking-celebration'
import { RANKING_PUNTOS } from '@/lib/status'
import { buildRanking, type FinishedOrder } from '@/lib/student-stats'
import type { Attendance, Grupo, Profile, WorkOrderEvent } from '@/lib/types'
import { cn } from '@/lib/utils'

function RankingList({
  ranking,
  viewerId,
  viewerIsAdmin,
}: {
  ranking: ReturnType<typeof buildRanking>
  viewerId: string | null
  viewerIsAdmin: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      {ranking.map((r, idx) => (
        <Card
          key={r.profile.id}
          className={cn(
            'animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500',
            idx === 0 && 'ring-2 ring-yellow-400/60',
          )}
          style={{ animationDelay: `${idx * 60}ms` }}
        >
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
              {viewerIsAdmin || r.profile.id === viewerId ? (
                <Link
                  href={`/alumnos/${r.profile.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {r.profile.apellido_nombre}
                </Link>
              ) : (
                <p className="font-medium text-foreground">{r.profile.apellido_nombre}</p>
              )}
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
              <p className="font-heading text-xl font-bold text-primary">
                <AnimatedNumber value={r.total} decimals={r.total % 1 !== 0 ? 1 : 0} />
              </p>
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
  const { profile: currentProfile } = await getCurrentProfile()

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

  // Si el alumno logueado empata en primer puesto en su propio grupo
  // (con más de 0 puntos, para no festejar un ranking vacío), se
  // dispara la celebración -- calculado acá una sola vez para toda la
  // página, no por cada tarjeta de grupo.
  let esGanador = false
  if (currentProfile && !currentProfile.is_admin) {
    const rankingDeSuGrupo = buildRanking(
      profiles.filter((p) => p.grupo === currentProfile.grupo),
      finishedOrders,
      workOrderEvents,
      attendance,
    )
    const mejorPuntaje = rankingDeSuGrupo[0]?.total ?? 0
    esGanador =
      mejorPuntaje > 0 &&
      rankingDeSuGrupo.some((r) => r.profile.id === currentProfile.id && r.total === mejorPuntaje)
  }

  return (
    <div className="flex flex-col gap-4">
      <RankingCelebration esGanador={esGanador} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Ranking</h1>
          <p className="text-sm text-muted-foreground">
            Cómo se calcula: cada OT finalizada reparte +{RANKING_PUNTOS.taller}pts (taller) o +
            {RANKING_PUNTOS.territorio}pts (territorio) entre quienes completaron pasos en ella,
            proporcional a cuántos pasos hizo cada uno -- quien hizo más trabajo en una OT se
            lleva proporcionalmente más, no una parte igual sin importar cuánto hizo.
            <br />
            +{RANKING_PUNTOS.presente}pts por cada asistencia presente, y{' '}
            {RANKING_PUNTOS.tardanza}pts por cada tardanza. Hay un ranking por grupo.
          </p>
        </div>
        {currentProfile?.is_admin && <ProbarCelebracionButton />}
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
                    <AnimatedNumber value={totalGrupo} decimals={totalGrupo % 1 !== 0 ? 1 : 0} />
                  </span>
                  <span className="text-[11px] text-muted-foreground">pts del grupo</span>
                </div>
              </div>
              <RankingList
                ranking={ranking}
                viewerId={currentProfile?.id ?? null}
                viewerIsAdmin={currentProfile?.is_admin ?? false}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
