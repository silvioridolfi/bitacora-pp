import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { WorkOrderEstado } from '@/lib/types'

export function EstadoBadge({
  estado,
  className,
}: {
  estado: string | null
  className?: string
}) {
  const style = estado ? WORK_ORDER_STATUS_STYLE[estado as WorkOrderEstado] : undefined
  if (!style) {
    return (
      <span
        className={cn(
          'rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
          className,
        )}
      >
        Sin estado
      </span>
    )
  }
  return (
    <span
      className={cn(
        'flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium',
        style.bg,
        style.border,
        style.text,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', style.dot)} />
      {style.label}
    </span>
  )
}
