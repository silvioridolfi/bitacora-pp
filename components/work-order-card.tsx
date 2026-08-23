'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Laptop, MapPin, School, User, Wrench, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/format'
import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import { completeWorkOrderStage } from '@/lib/actions'
import { WORK_ORDER_ETAPAS, WORK_ORDER_ETAPA_INFO } from '@/lib/types'
import type { WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'

export function WorkOrderCard({
  workOrder,
  onClick,
  isAdmin = false,
  currentProfileId = null,
}: {
  workOrder: WorkOrder
  onClick?: () => void
  isAdmin?: boolean
  currentProfileId?: string | null
}) {
  const style = WORK_ORDER_STATUS_STYLE[workOrder.estado]
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const doneEtapas = new Set((workOrder.work_order_stages ?? []).map((s) => s.etapa))
  const nextEtapa =
    workOrder.tipo === 'taller' && workOrder.estado !== 'Finalizada OK' && workOrder.estado !== 'Derivada'
      ? WORK_ORDER_ETAPAS.find((e) => !doneEtapas.has(e))
      : undefined
  const nextInfo = nextEtapa ? WORK_ORDER_ETAPA_INFO[nextEtapa] : undefined
  const nextLocked = nextInfo?.reservada && !isAdmin

  function handleQuickAction(e: React.MouseEvent) {
    e.stopPropagation()
    if (!nextEtapa || nextLocked) return
    startTransition(async () => {
      const result = await completeWorkOrderStage(workOrder.id, nextEtapa, currentProfileId)
      if (result.ok) {
        toast.success(`${WORK_ORDER_ETAPA_INFO[nextEtapa].label} completada`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.()
      }}
      className={cn(
        'flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:shadow-sm cursor-pointer',
        style.bg,
        style.border,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading text-xs font-bold tracking-tight text-foreground">
          {workOrder.codigo}
        </span>
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
            style.text,
          )}
        >
          <span className={cn('size-1.5 rounded-full', style.dot)} />
          {style.label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {workOrder.tipo === 'taller' ? (
          <Wrench className="size-3.5 text-muted-foreground" />
        ) : (
          <MapPin className="size-3.5 text-muted-foreground" />
        )}
        <Laptop className="size-3.5 text-muted-foreground" />
        <span className="truncate">{workOrder.equipment?.numero_serie ?? '—'}</span>
      </div>
      {workOrder.school && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <School className="size-3.5" />
          <span className="truncate">{workOrder.school.nombre}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="size-3.5" />
          {workOrder.responsable?.apellido_nombre ?? 'Sin asignar'}
        </span>
        <span>{formatDate(workOrder.fecha)}</span>
      </div>

      {nextInfo && (
        <button
          type="button"
          disabled={pending || nextLocked}
          onClick={handleQuickAction}
          className={cn(
            'mt-1 flex items-center justify-between gap-1.5 rounded-md border border-dashed px-2 py-1.5 text-[11px] font-medium transition-colors',
            nextLocked
              ? 'cursor-not-allowed border-border text-muted-foreground'
              : 'border-primary/40 text-primary hover:bg-primary/10',
          )}
        >
          <span className="truncate">
            {nextLocked ? `Falta: ${nextInfo.label} (coordinador)` : `Marcar: ${nextInfo.label}`}
          </span>
          {!nextLocked && <ChevronRight className="size-3.5 shrink-0" />}
        </button>
      )}
    </div>
  )
}

export function WorkOrderRowLink({ workOrder }: { workOrder: WorkOrder }) {
  return (
    <Link
      href={`/equipos/${workOrder.equipment_id}`}
      className="text-sm font-medium text-primary underline-offset-2 hover:underline"
    >
      {workOrder.equipment?.numero_serie}
    </Link>
  )
}
