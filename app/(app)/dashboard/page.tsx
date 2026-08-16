import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import type { WorkOrderEstado } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data } = await supabase.from('work_orders').select('tipo, estado, grupo')
  const orders = (data ?? []) as { tipo: string; estado: WorkOrderEstado; grupo: string | null }[]

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

  const kpis = [
    { label: 'Recibidos', value: recibidos },
    { label: 'Diagnosticados', value: diagnosticados },
    { label: 'Desbloqueados', value: desbloqueados },
    { label: 'Con SO instalado', value: conSO },
    { label: 'Finalizados OK', value: finalizados },
    { label: 'Derivados', value: derivados },
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
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <span className="font-heading text-2xl font-bold text-foreground">
                {kpi.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                % de avance general
              </h2>
              <span className="font-heading text-xl font-bold text-primary">{avance}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${avance}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Órdenes finalizadas o derivadas sobre el total de {total}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Comparativa por grupo
            </h2>
            {[
              { label: 'Grupo 1', list: grupo1 },
              { label: 'Grupo 2', list: grupo2 },
            ].map((g) => (
              <div key={g.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{g.label}</span>
                  <span className="text-muted-foreground">
                    {g.list.length} OT · {finalizadoRate(g.list)}% finalizadas
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${finalizadoRate(g.list)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Distribución por estado
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {estadoCounts.map(({ estado, count }) => {
              const style = WORK_ORDER_STATUS_STYLE[estado]
              return (
                <div
                  key={estado}
                  className={cn('flex flex-col gap-1 rounded-lg border p-3', style.bg, style.border)}
                >
                  <span className={cn('text-xs font-medium', style.text)}>{estado}</span>
                  <span className="font-heading text-lg font-bold text-foreground">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
