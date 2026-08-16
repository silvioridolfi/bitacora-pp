import { createClient } from '@/lib/supabase/server'
import { WorkOrderCard } from '@/components/work-order-card'
import { WORK_ORDER_ESTADO_ORDER, WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import type { WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function TableroPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const { tipo } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('work_orders')
    .select(
      '*, equipment:equipment_id(*), responsable:responsable_id(*), school:school_id(*)',
    )
    .order('fecha', { ascending: false })
    .limit(300)

  if (tipo === 'taller' || tipo === 'territorio') {
    query = query.eq('tipo', tipo)
  }

  const { data } = await query
  const orders = (data ?? []) as unknown as WorkOrder[]

  const columns = WORK_ORDER_ESTADO_ORDER.map((estado) => ({
    estado,
    items: orders.filter((o) => o.estado === estado),
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tablero</h1>
          <p className="text-sm text-muted-foreground">
            Vista kanban de todas las órdenes de trabajo por estado.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {[
            { label: 'Todos', value: '' },
            { label: 'Taller', value: 'taller' },
            { label: 'Territorio', value: 'territorio' },
          ].map((opt) => (
            <a
              key={opt.value}
              href={opt.value ? `/tablero?tipo=${opt.value}` : '/tablero'}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                (tipo ?? '') === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          const style = WORK_ORDER_STATUS_STYLE[col.estado]
          return (
            <div
              key={col.estado}
              className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-card/50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn('flex items-center gap-1.5 text-sm font-semibold', style.text)}>
                  <span className={cn('size-2 rounded-full', style.dot)} />
                  {col.estado}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {col.items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {col.items.map((wo) => (
                  <WorkOrderCard key={wo.id} workOrder={wo} />
                ))}
                {col.items.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Sin OT en este estado
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
