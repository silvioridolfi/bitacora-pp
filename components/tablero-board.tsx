'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { WorkOrderCard } from '@/components/work-order-card'
import { WorkOrderForm } from '@/components/work-order-form'
import { WORK_ORDER_ESTADO_ORDER, WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import type { Equipment, Profile, School, WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TableroBoard({
  orders,
  equipment,
  profiles,
  schools,
}: {
  orders: WorkOrder[]
  equipment: Equipment[]
  profiles: Profile[]
  schools: School[]
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((o) => {
      return (
        o.codigo?.toLowerCase().includes(q) ||
        o.equipment?.numero_serie?.toLowerCase().includes(q) ||
        o.responsable?.apellido_nombre?.toLowerCase().includes(q) ||
        o.school?.nombre?.toLowerCase().includes(q)
      )
    })
  }, [orders, query])

  const columns = WORK_ORDER_ESTADO_ORDER.map((estado) => ({
    estado,
    items: filtered.filter((o) => o.estado === estado),
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código, N° de serie, responsable o escuela…"
          className="pl-8"
        />
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
                <span
                  className={cn('flex items-center gap-1.5 text-sm font-semibold', style.text)}
                >
                  <span className={cn('size-2 rounded-full', style.dot)} />
                  {col.estado}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {col.items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {col.items.map((wo) => (
                  <WorkOrderForm
                    key={wo.id}
                    tipo={wo.tipo}
                    equipment={equipment}
                    profiles={profiles}
                    schools={schools}
                    workOrder={wo}
                    trigger={<WorkOrderCard workOrder={wo} />}
                  />
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
