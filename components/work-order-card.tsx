'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Laptop, MapPin, School, User, Wrench, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatHoraArgentina } from '@/lib/format'
import { hasReliableCreatedAt } from '@/lib/timezone'
import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import { toggleWorkOrderEvent } from '@/lib/actions'
import { FED_PROFILE_ID, WORK_ORDER_PASOS_BLOQUEANTES, WORK_ORDER_PASO_INFO } from '@/lib/types'
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
    workOrder.estado !== 'Finalizada OK' && workOrder.estado !== 'Derivada'
      ? pasosAplicables.find((p) => !doneClaves.has(p))
      : undefined
  const nextInfo = nextPaso ? WORK_ORDER_PASO_INFO[nextPaso] : undefined

  function handleQuickAction(e: React.MouseEvent) {
    e.stopPropagation()
    if (!nextPaso) return
    const profileId = nextInfo?.responsableFijo ? FED_PROFILE_ID : currentProfileId
    startTransition(async () => {
      const result = await toggleWorkOrderEvent(workOrder.id, nextPaso, profileId)
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
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex items-center gap-1.5">
          <span className="whitespace-nowrap font-heading text-xs font-bold tracking-tight text-foreground">
            {workOrder.codigo}
          </span>
          {workOrder.grupo_creador && (
            <span
              className={cn(
                'whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                workOrder.grupo_creador === 'Grupo 1'
                  ? 'bg-violet-100 text-violet-700'
                  : workOrder.grupo_creador === 'Grupo 2'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {workOrder.grupo_creador}
            </span>
          )}
          {workOrder.session && (
            <span className="whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Sesión #{workOrder.session.sesion_n}
            </span>
          )}
        </span>
        <span
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
            style.text,
          )}
        >
          <span className={cn('size-1.5 shrink-0 rounded-full', style.dot)} />
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
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-1">
          <User className="size-3.5 shrink-0" />
          <span className="truncate">{workOrder.responsable?.apellido_nombre ?? 'Sin asignar'}</span>
          {responsableRoles.map((rol) => (
            <span
              key={rol}
              className="whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground"
            >
              {DAILY_ROLE_SHORT[rol]}
            </span>
          ))}
        </span>
        <span
          className="whitespace-nowrap"
          title={
            hasReliableCreatedAt(workOrder.created_at)
              ? `Creada a las ${formatHoraArgentina(workOrder.created_at)}`
              : undefined
          }
        >
          {formatDate(workOrder.fecha)}
          {hasReliableCreatedAt(workOrder.created_at) &&
            ` · ${formatHoraArgentina(workOrder.created_at)}`}
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
          disabled={pending}
          onClick={handleQuickAction}
          className="mt-1 flex items-center justify-between gap-1.5 rounded-md border border-dashed border-primary/40 px-2 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <span className="truncate">Marcar: {nextInfo.label}</span>
          <ChevronRight className="size-3.5 shrink-0" />
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
