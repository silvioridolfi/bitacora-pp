'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  removeWorkOrderEvent,
  removeWorkOrderEventById,
  toggleWorkOrderEvent,
} from '@/lib/actions'
import {
  WORK_ORDER_PASOS,
  WORK_ORDER_PASOS_BLOQUEANTES,
  WORK_ORDER_PASO_INFO,
  FED_PROFILE_ID,
} from '@/lib/types'
import type { DailyRoleName, Profile, WorkOrderEvent, WorkOrderPaso } from '@/lib/types'
import { cn } from '@/lib/utils'

const nativeSelectClass =
  'h-8 w-40 rounded-md border border-input bg-transparent px-2 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/** Qué rol del día (asignado en Asistencia) corresponde a cada paso del
 * pipeline técnico -- se usa solo para SUGERIR quién lo hizo, nunca para
 * asignarlo en silencio. */
const ROL_PASO_A_DAILY_ROLE: Partial<Record<WorkOrderPaso, DailyRoleName>> = {
  desarme: 'Técnico',
  desbloqueo: 'Técnico',
  armado: 'Técnico',
  cambio_pila: 'Técnico',
  prueba_encendido: 'Tester/Instalador',
  instalacion_so: 'Tester/Instalador',
}

export function WorkOrderTimeline({
  workOrderId,
  events,
  profiles,
  isAdmin,
  currentProfileId,
  saltarDesbloqueo = false,
  rolesByProfile = {},
}: {
  workOrderId: string
  events: WorkOrderEvent[]
  profiles: Profile[]
  isAdmin: boolean
  currentProfileId: string | null
  /** true si el equipo llegó "Enciende sin bloqueo": esa etapa no aplica. */
  saltarDesbloqueo?: boolean
  /** Roles del día (Asistencia) por alumno -- se usa para sugerir de
   * entrada quién completó cada paso, solo cuando hay un único alumno
   * con el rol correspondiente ese día. Siempre queda editable. */
  rolesByProfile?: Record<string, DailyRoleName[]>
}) {
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [otroDescripcion, setOtroDescripcion] = useState('')
  const router = useRouter()

  /** Para un paso dado, si hay exactamente un alumno (de este grupo) con
   * el rol del día que corresponde, lo sugiere -- si hay 0 o más de 1,
   * no sugiere nada (mejor vacío que arriesgar una elección ambigua). */
  function sugeridoPara(clave: WorkOrderPaso): string | null {
    const dailyRole = ROL_PASO_A_DAILY_ROLE[clave]
    if (!dailyRole) return null
    const candidatos = profiles.filter((p) => rolesByProfile[p.id]?.includes(dailyRole))
    return candidatos.length === 1 ? candidatos[0].id : null
  }

  const pasosBloqueantes = WORK_ORDER_PASOS_BLOQUEANTES.filter(
    (p) => !(p === 'desbloqueo' && saltarDesbloqueo),
  )
  const pasosOpcionales = WORK_ORDER_PASOS.filter(
    (p) => !WORK_ORDER_PASOS_BLOQUEANTES.includes(p),
  )

  const doneByClave = new Map<WorkOrderPaso, WorkOrderEvent>()
  for (const e of events) {
    if (e.clave !== 'otro') doneByClave.set(e.clave, e)
  }
  const otros = events.filter((e) => e.clave === 'otro')

  function handleToggle(clave: WorkOrderPaso) {
    const info = WORK_ORDER_PASO_INFO[clave]
    if (info.responsableFijo) {
      startTransition(async () => {
        const result = await toggleWorkOrderEvent(workOrderId, clave, FED_PROFILE_ID)
        if (result.ok) {
          toast.success(`${WORK_ORDER_PASO_INFO[clave].label} completado`)
          router.refresh()
        } else {
          toast.error(result.error)
        }
      })
      return
    }
    // Si el usuario no tocó el selector, se usa la sugerencia (rol del día
    // asignado en Asistencia) -- viene de un dato real y explícito, no de
    // "quien está mirando la pantalla ahora" como el bug anterior. Sigue
    // siendo 100% editable: si no hay sugerencia clara, queda vacío y
    // exige elegir a mano, igual que antes.
    const profileId = selected[clave] ?? sugeridoPara(clave)
    if (!profileId) {
      toast.error('Elegí quién completó este paso antes de marcarlo.')
      return
    }
    startTransition(async () => {
      const result = await toggleWorkOrderEvent(workOrderId, clave, profileId)
      if (result.ok) {
        toast.success(`${WORK_ORDER_PASO_INFO[clave].label} completado`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUndo(clave: WorkOrderPaso) {
    startTransition(async () => {
      const result = await removeWorkOrderEvent(workOrderId, clave)
      if (result.ok) {
        toast.success(`${WORK_ORDER_PASO_INFO[clave].label} revertido`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleAddOtro() {
    if (!otroDescripcion.trim()) return
    startTransition(async () => {
      const result = await toggleWorkOrderEvent(
        workOrderId,
        'otro',
        currentProfileId,
        otroDescripcion.trim(),
      )
      if (result.ok) {
        setOtroDescripcion('')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRemoveOtro(id: string) {
    startTransition(async () => {
      const result = await removeWorkOrderEventById(id)
      if (!result.ok) toast.error(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <span className="text-xs font-semibold text-foreground">Línea de tiempo de la OT</span>

      {pasosBloqueantes.map((clave) => {
        const info = WORK_ORDER_PASO_INFO[clave]
        const done = doneByClave.get(clave)

        return (
          <div
            key={clave}
            className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2">
              {done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-finalizada" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex flex-col leading-tight">
                <span className={cn(done && 'text-muted-foreground line-through')}>
                  {info.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {info.rol}
                  {done?.profile?.apellido_nombre ? ` · ${done.profile.apellido_nombre}` : ''}
                </span>
              </div>
            </div>

            {done ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 self-end text-xs sm:self-auto"
                disabled={pending || (info.responsableFijo && !isAdmin)}
                onClick={() => handleUndo(clave)}
              >
                Deshacer
              </Button>
            ) : info.responsableFijo ? (
              <Button
                type="button"
                size="sm"
                className="h-7 self-end text-xs sm:self-auto"
                disabled={pending}
                onClick={() => handleToggle(clave)}
              >
                Marcar hecho
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <select
                  className={nativeSelectClass}
                  value={selected[clave] ?? sugeridoPara(clave) ?? ''}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [clave]: e.target.value }))
                  }
                >
                  <option value="">¿Quién lo hizo?</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.apellido_nombre}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={pending || !(selected[clave] ?? sugeridoPara(clave))}
                  onClick={() => handleToggle(clave)}
                >
                  Marcar hecho
                </Button>
              </div>
            )}
          </div>
        )
      })}

      <div className="border-t border-border pt-2">
        <p className="mb-1.5 text-[11px] text-muted-foreground">
          Opcional -- no cambia el estado, se puede tildar en cualquier momento
        </p>
        {pasosOpcionales
          .filter((p) => p !== 'otro')
          .map((clave) => {
            const done = doneByClave.get(clave)
            return (
              <label key={clave} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={!!done}
                  disabled={pending}
                  onChange={() => (done ? handleUndo(clave) : handleToggle(clave))}
                />
                <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                  {WORK_ORDER_PASO_INFO[clave].label}
                </span>
              </label>
            )
          })}

        <div className="mt-2 flex flex-col gap-1.5">
          {otros.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-2 rounded-md bg-card px-2 py-1.5 text-xs"
            >
              <span className="text-foreground">{e.descripcion}</span>
              <button
                type="button"
                onClick={() => handleRemoveOtro(e.id)}
                disabled={pending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Input
              value={otroDescripcion}
              onChange={(e) => setOtroDescripcion(e.target.value)}
              placeholder="Otro detalle técnico…"
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 text-xs"
              disabled={pending || !otroDescripcion.trim()}
              onClick={handleAddOtro}
            >
              Agregar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
