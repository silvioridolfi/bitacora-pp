'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toggleWorkOrderAction } from '@/lib/actions'
import { Input } from '@/components/ui/input'
import { WORK_ORDER_ACCIONES } from '@/lib/types'
import type { WorkOrderAction } from '@/lib/types'

export function WorkOrderActionsChecklist({
  workOrderId,
  actions,
}: {
  workOrderId: string
  actions: WorkOrderAction[]
}) {
  const [pending, startTransition] = useTransition()
  const [otroDescripcion, setOtroDescripcion] = useState('')
  const router = useRouter()

  const doneByAccion = new Map(actions.map((a) => [a.accion, a]))

  function handleToggle(accion: (typeof WORK_ORDER_ACCIONES)[number]) {
    const descripcion = accion === 'Otro' ? otroDescripcion || null : null
    startTransition(async () => {
      const result = await toggleWorkOrderAction(workOrderId, accion, descripcion)
      if (result.ok) {
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <span className="text-xs font-semibold text-foreground">Qué se hizo (checklist)</span>
      <p className="text-[11px] text-muted-foreground">
        Estos ítems no siguen un orden -- tildá lo que corresponda, en cualquier momento.
      </p>
      {WORK_ORDER_ACCIONES.map((accion) => {
        const done = doneByAccion.get(accion)
        return (
          <div key={accion} className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!done}
                disabled={pending}
                onChange={() => handleToggle(accion)}
              />
              <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                {accion}
              </span>
            </label>
            {accion === 'Otro' && !done && (
              <Input
                value={otroDescripcion}
                onChange={(e) => setOtroDescripcion(e.target.value)}
                placeholder="Detalle (opcional)"
                className="ml-6 h-8 w-auto text-xs"
              />
            )}
            {accion === 'Otro' && done?.descripcion && (
              <p className="ml-6 text-[11px] text-muted-foreground">{done.descripcion}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
