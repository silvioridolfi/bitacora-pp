'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Laptop, MapPin, School, User, Wrench, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatHoraArgentina } from '@/lib/format'
import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import { toggleWorkOrderEvent } from '@/lib/actions'
import { WORK_ORDER_PASOS_BLOQUEANTES, WORK_ORDER_PASO_INFO } from '@/lib/types'
import type { DailyRoleName, WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'

const DAILY_ROLE_SHORT: Record<DailyRoleName, string> = {
  Líder: 'Líder',
  Documentador: 'Doc.',
  Técnico: 'Técnico',
  'Tester/Instalador': 'Tester',
  'Control de Calidad': 'Calidad',
}

export function WorkOrderCard({
  workOrder,
  onClick,
  isAdmin = false,
  currentProfileId = null,
  responsableRoles = [],
}: {
  workOrder: WorkOrder
  onClick?: () => void
  isAdmin?: boolean
  currentProfileId?: string | null
  responsableRoles?: DailyRoleName[]
}) {
  const style = WORK_ORDER_STATUS_STYLE[workOrder.estado]
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const doneClaves = new Set((workOrder.work_order_events ?? []).map((e) => e.clave))
  // El equipo ya vino "Enciende sin bloqueo" -- esa etapa no aplica, se
  // libera directo y nunca vuelve a bloquearse.
  const pasosAplicables = WORK_ORDER_PASOS_BLOQUEANTES.filter(
    (p) => !(p === 'desbloqueo' && workOrder.equipment?.estado_inicial === 'Enciende sin bloqueo'),
  )
  const nextPaso =
    workOrder.tipo === 'taller' && workOrder.estado !== 'Finalizada OK' && workOrder.estado !== 'Derivada'
      ? pasosAplicables.find((p) => !doneClaves.has(p))
      : undefined
  const nextInfo = nextPaso ? WORK_ORDER_PASO_INFO[nextPaso] : undefined
  const nextLocked = nextInfo?.reservada && !isAdmin

  function handleQuickAction(e: React.MouseEvent) {
    e.stopPropagation()
    if (!nextPaso || nextLocked) return
    startTransition(async () => {
      const result = await toggleWorkOrderEvent(workOrder.id, nextPaso, currentProfileId)
      if (result.ok) {
        toast.success(`${WORK_ORDER_PASO_INFO[nextPaso].label} completado`)
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
        <span className="flex items-center gap-1.5">
          <span className="font-heading text-xs font-bold tracking-tight text-foreground">
            {workOrder.codigo}
          </span>
          {workOrder.grupo_creador && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {workOrder.grupo_creador}
            </span>
          )}
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
        <span className="flex flex-wrap items-center gap-1">
          <User className="size-3.5 shrink-0" />
          {workOrder.responsable?.apellido_nombre ?? 'Sin asignar'}
          {responsableRoles.map((rol) => (
            <span
              key={rol}
              className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground"
            >
              {DAILY_ROLE_SHORT[rol]}
            </span>
          ))}
        </span>
        <span title={`Creada a las ${formatHoraArgentina(workOrder.created_at)}`}>
          {formatDate(workOrder.fecha)} · {formatHoraArgentina(workOrder.created_at)}
        </span>
      </div>
      {workOrder.responsable_original_id &&
        workOrder.responsable_original_id !== workOrder.responsable_id && (
          <p className="text-[10px] text-muted-foreground">
            Creada por {workOrder.responsable_original?.apellido_nombre ?? '—'}
          </p>
        )}

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
            {nextLocked ? `Falta: ${nextInfo.label} (FED)` : `Marcar: ${nextInfo.label}`}
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
