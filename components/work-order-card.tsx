import Link from 'next/link'
import { Laptop, MapPin, School, User, Wrench } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import type { WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'

export function WorkOrderCard({
  workOrder,
  onClick,
}: {
  workOrder: WorkOrder
  onClick?: () => void
}) {
  const style = WORK_ORDER_STATUS_STYLE[workOrder.estado]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:shadow-sm',
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
    </button>
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
