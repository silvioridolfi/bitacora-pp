'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchInput } from '@/components/search-input'
import { WorkOrderCard } from '@/components/work-order-card'
import { WorkOrderForm } from '@/components/work-order-form'
import { useRealtimeWorkOrders } from '@/hooks/use-realtime-work-orders'
import type { DailyRoleName, Profile, School, WorkOrder } from '@/lib/types'

function codigoNumero(codigo: string): number {
  const match = /(\d+)$/.exec(codigo)
  return match ? parseInt(match[1], 10) : 0
}

export function WorkOrderGrid({
  orders,
  profiles,
  schools,
  isAdmin,
  currentProfileId,
  rolesByProfile,
}: {
  orders: WorkOrder[]
  profiles: Profile[]
  schools?: School[]
  isAdmin: boolean
  currentProfileId: string | null
  rolesByProfile: Record<string, DailyRoleName[]>
}) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  useRealtimeWorkOrders()

  // Última versión conocida de la OT seleccionada -- si la vista está
  // filtrada por estado (ej. un KPI del dashboard) y esa OT cambia de
  // estado, puede desaparecer del array `orders` tras el refresh. En
  // vez de cerrar el modal de golpe, seguimos mostrando los últimos
  // datos que sí llegamos a ver.
  const lastKnownRef = useRef<WorkOrder | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? orders.filter(
          (o) =>
            o.codigo?.toLowerCase().includes(q) ||
            o.equipment?.numero_serie?.toLowerCase().includes(q) ||
            o.responsable?.apellido_nombre?.toLowerCase().includes(q) ||
            o.school?.nombre?.toLowerCase().includes(q),
        )
      : orders
    return [...base].sort((a, b) => codigoNumero(b.codigo) - codigoNumero(a.codigo))
  }, [orders, query])

  const foundOrder = selectedId ? (orders.find((o) => o.id === selectedId) ?? null) : null

  useEffect(() => {
    if (foundOrder) lastKnownRef.current = foundOrder
  }, [foundOrder])

  const selectedOrder = selectedId ? (foundOrder ?? lastKnownRef.current) : null

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por código, N° de serie, responsable o escuela…"
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ninguna OT coincide con la búsqueda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((wo) => (
            <WorkOrderCard
              key={wo.id}
              workOrder={wo}
              isAdmin={isAdmin}
              onClick={() => setSelectedId(wo.id)}
              responsableRoles={
                wo.responsable_id ? (rolesByProfile[wo.responsable_id] ?? []) : []
              }
              profiles={profiles}
              rolesByProfile={rolesByProfile}
            />
          ))}
        </div>
      )}

      {selectedOrder && (
        <WorkOrderForm
          tipo={selectedOrder.tipo}
          profiles={profiles}
          schools={schools}
          workOrder={selectedOrder}
          isAdmin={isAdmin}
          currentProfileId={currentProfileId}
          rolesByProfile={rolesByProfile}
          open={!!selectedOrder}
          onOpenChange={(v) => setSelectedId(v ? selectedOrder.id : null)}
        />
      )}
    </div>
  )
}
