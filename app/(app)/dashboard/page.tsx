import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import { AnimatedNumber } from '@/components/animated-number'
import { AnimatedProgressBar } from '@/components/animated-progress-bar'
import { TrendChart } from '@/components/trend-chart'
import { Laptop, Trophy, Users } from 'lucide-react'
import type { WorkOrderEstado } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data }, { count: equiposCount }, { data: sessions }] = await Promise.all([
    supabase.from('work_orders').select('tipo, estado, grupo, fecha'),
    supabase.from('equipment').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('id, fecha').order('fecha', { ascending: false }).limit(1),
  ])
  const orders = (data ?? []) as {
    tipo: string
    estado: WorkOrderEstado
    grupo: string | null
    fecha: string | null
  }[]
  const ultimaFecha = sessions?.[0]?.fecha ?? null

  const total = orders.length
  const recibidos = total
  const diagnosticados = orders.filter((o) => o.estado !== 'Pendiente').length
  const desbloqueados = orders.filter((o) =>
    ['Desbloqueada', 'Instalando SO', 'Configurando', 'Probando', 'Finalizada OK'].includes(
      o.estado,
    ),
  ).length
  const conSO = orders.filter((o) =>
    ['Instalando SO', 'Configurando', 'Probando', 'Finalizada OK'].includes(o.estado),
  ).length
  const finalizados = orders.filter((o) => o.estado === 'Finalizada OK').length
  const derivados = orders.filter((o) => o.estado === 'Derivada').length
  const avance = total > 0 ? Math.round(((finalizados + derivados) / total) * 100) : 0

  const grupo1 = orders.filter((o) => o.grupo === 'Grupo 1')
  const grupo2 = orders.filter((o) => o.grupo === 'Grupo 2')
  const finalizadoRate = (list: typeof orders) =>
    list.length > 0
      ? Math.round((list.filter((o) => o.estado === 'Finalizada OK').length / list.length) * 100)
      : 0

  // Tendencia: OT finalizadas por semana, últimas 8 semanas (lunes a
  // domingo, según la fecha de la OT).
  function startOfWeek(d: Date) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = (day === 0 ? -6 : 1) - day // lunes como inicio de semana
    date.setDate(date.getDate() + diff)
    date.setHours(0, 0, 0, 0)
    return date
  }
  const hoy = new Date()
  const semanas = Array.from({ length: 8 }).map((_, i) => {
    const inicio = startOfWeek(hoy)
    inicio.setDate(inicio.getDate() - (7 - i) * 7)
    const fin = new Date(inicio)
    fin.setDate(fin.getDate() + 6)
    const cantidad = orders.filter((o) => {
      if (o.estado !== 'Finalizada OK' || !o.fecha) return false
      const f = new Date(o.fecha + 'T00:00:00')
      return f >= inicio && f <= fin
    }).length
    return {
      semana: `${inicio.getDate()}/${inicio.getMonth() + 1}`,
      cantidad,
    }
  })

  const kpis = [
    { label: 'Recibidos', value: recibidos, href: '/tablero' },
    {
      label: 'Diagnosticados',
      value: diagnosticados,
      href: `/tablero?estados=${encodeURIComponent(
        'Diagnosticando,Desbloqueada,Instalando SO,Configurando,Probando,Finalizada OK,Derivada',
      )}`,
    },
    {
      label: 'Desbloqueados',
      value: desbloqueados,
      href: `/tablero?estados=${encodeURIComponent(
        'Desbloqueada,Instalando SO,Configurando,Probando,Finalizada OK',
      )}`,
    },
    {
      label: 'Con SO instalado',
      value: conSO,
      href: `/tablero?estados=${encodeURIComponent(
        'Instalando SO,Configurando,Probando,Finalizada OK',
      )}`,
    },
    { label: 'Finalizados OK', value: finalizados, href: '/tablero?estado=Finalizada OK' },
    { label: 'Derivados', value: derivados, href: '/tablero?estado=Derivada' },
  ]

  const estadoCounts = Object.keys(WORK_ORDER_STATUS_STYLE).map((estado) => ({
    estado: estado as WorkOrderEstado,
    count: orders.filter((o) => o.estado === estado).length,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores recalculados en vivo a partir de las {total} órdenes de trabajo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, idx) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <span className="font-heading text-2xl font-bold text-foreground">
                  <AnimatedNumber value={kpi.value} />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Distribución por estado
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {estadoCounts.map(({ estado, count }, idx) => {
                const style = WORK_ORDER_STATUS_STYLE[estado]
                return (
                  <Link
                    key={estado}
                    href={`/tablero?estado=${encodeURIComponent(estado)}`}
                    className={cn(
                      'flex animate-in flex-col gap-0.5 rounded-lg border p-2 fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500 transition-opacity hover:opacity-80',
                      style.bg,
                      style.border,
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <span className={cn('text-[11px] font-medium leading-tight', style.text)}>
                      {style.label}
                    </span>
                    <span className="font-heading text-base font-bold text-foreground">
                      <AnimatedNumber value={count} />
                    </span>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-5">
          <h2 className="text-sm font-semibold text-foreground">
            OT finalizadas por semana
          </h2>
          <TrendChart data={semanas} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Link href={`/tablero?estados=${encodeURIComponent('Finalizada OK,Derivada')}`}>
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-semibold text-foreground">
                  % de avance general
                </h2>
                <span className="font-heading text-xl font-bold text-primary">
                  <AnimatedNumber value={avance} suffix="%" />
                </span>
              </div>
              <AnimatedProgressBar percent={avance} colorClass="bg-primary" />
              <p className="text-xs text-muted-foreground">
                Órdenes finalizadas o derivadas sobre el total de {total}.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Comparativa por grupo
            </h2>
            {[
              { label: 'Grupo 1', list: grupo1 },
              { label: 'Grupo 2', list: grupo2 },
            ].map((g) => (
              <Link
                key={g.label}
                href={`/tablero?grupo=${encodeURIComponent(g.label)}`}
                className="flex flex-col gap-1.5 rounded-md p-1 -m-1 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{g.label}</span>
                  <span className="text-muted-foreground">
                    <AnimatedNumber value={g.list.length} /> OT ·{' '}
                    <AnimatedNumber value={finalizadoRate(g.list)} suffix="%" /> finalizadas
                  </span>
                </div>
                <AnimatedProgressBar percent={finalizadoRate(g.list)} colorClass="bg-accent" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/equipos">
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Laptop className="size-8 text-primary" />
              <div>
                <p className="font-heading text-xl font-bold text-foreground">
                  <AnimatedNumber value={equiposCount ?? 0} />
                </p>
                <p className="text-xs text-muted-foreground">Equipos cargados</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/asistencia">
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="size-8 text-primary" />
              <div>
                <p className="font-heading text-sm font-bold text-foreground">
                  {ultimaFecha ? formatDate(ultimaFecha) : 'Sin fechas'}
                </p>
                <p className="text-xs text-muted-foreground">Última asistencia cargada</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ranking">
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Trophy className="size-8 text-primary" />
              <div>
                <p className="font-heading text-sm font-bold text-foreground">Ver ranking</p>
                <p className="text-xs text-muted-foreground">Puntos por grupo</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
