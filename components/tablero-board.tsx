'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WorkOrderCard } from '@/components/work-order-card'
import { WorkOrderForm } from '@/components/work-order-form'
import { WORK_ORDER_ESTADO_ORDER, WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import { useRealtimeWorkOrders } from '@/hooks/use-realtime-work-orders'
import type { DailyRoleName, Profile, School, WorkOrder, WorkOrderEstado } from '@/lib/types'
import { cn } from '@/lib/utils'

const COLUMN_SCROLL_STEP = 304 // ancho de columna (288px) + gap (16px)

export function TableroBoard({
  orders,
  profiles,
  schools,
  isAdmin,
  currentProfileId,
  rolesByProfile = {},
}: {
  orders: WorkOrder[]
  profiles: Profile[]
  schools: School[]
  isAdmin: boolean
  currentProfileId: string | null
  rolesByProfile?: Record<string, DailyRoleName[]>
}) {
  const [query, setQuery] = useState('')
  useRealtimeWorkOrders()
  const searchParams = useSearchParams()
  const targetEstado = searchParams.get('estado') as WorkOrderEstado | null
  const columnRefs = useRef<Partial<Record<WorkOrderEstado, HTMLDivElement | null>>>({})
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // -- Drag-to-scroll: arrastrar el fondo del tablero para desplazarlo,
  // sin romper el click normal sobre una card (que abre el modal). --
  const dragState = useRef({ isDown: false, moved: false, startX: 0, startScrollLeft: 0 })

  function handleMouseDown(e: React.MouseEvent) {
    const el = scrollRef.current
    if (!el) return
    dragState.current = {
      isDown: true,
      moved: false,
      startX: e.pageX - el.offsetLeft,
      startScrollLeft: el.scrollLeft,
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    const el = scrollRef.current
    if (!el || !dragState.current.isDown) return
    const x = e.pageX - el.offsetLeft
    const walk = x - dragState.current.startX
    if (Math.abs(walk) > 5) dragState.current.moved = true
    if (dragState.current.moved) {
      el.scrollLeft = dragState.current.startScrollLeft - walk
    }
  }

  function endDrag() {
    dragState.current.isDown = false
  }

  function handleClickCapture(e: React.MouseEvent) {
    // Si hubo arrastre real, cancelamos el click que dispararía el modal.
    if (dragState.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      dragState.current.moved = false
    }
  }

  function scrollByStep(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * COLUMN_SCROLL_STEP, behavior: 'smooth' })
  }

  useEffect(() => {
    if (targetEstado && columnRefs.current[targetEstado]) {
      columnRefs.current[targetEstado]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest',
      })
    }
  }, [targetEstado])

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
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, N° de serie, responsable o escuela…"
            className="pl-8"
          />
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollByStep(-1)}
            title="Desplazar hacia la izquierda"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollByStep(1)}
            title="Desplazar hacia la derecha"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={handleClickCapture}
        className="flex cursor-grab select-none gap-3 overflow-x-auto pb-2 active:cursor-grabbing"
      >
        {columns.map((col) => {
          const style = WORK_ORDER_STATUS_STYLE[col.estado]
          const highlighted = targetEstado === col.estado
          return (
            <div
              key={col.estado}
              ref={(el) => {
                columnRefs.current[col.estado] = el
              }}
              className={cn(
                'flex w-72 shrink-0 flex-col gap-3 rounded-xl border bg-card/50 p-3 transition-colors',
                highlighted ? 'border-primary ring-2 ring-primary/40' : 'border-border',
              )}
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
                    profiles={profiles}
                    schools={schools}
                    workOrder={wo}
                    trigger={
                      <WorkOrderCard
                        workOrder={wo}
                        isAdmin={isAdmin}
                        currentProfileId={currentProfileId}
                        responsableRoles={
                          wo.responsable_id ? (rolesByProfile[wo.responsable_id] ?? []) : []
                        }
                      />
                    }
                    isAdmin={isAdmin}
                    currentProfileId={currentProfileId}
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
