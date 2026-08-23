'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { completeWorkOrderStage, undoWorkOrderStage } from '@/lib/actions'
import { WORK_ORDER_ETAPAS, WORK_ORDER_ETAPA_INFO } from '@/lib/types'
import type { Profile, WorkOrderEtapa, WorkOrderStage } from '@/lib/types'
import { cn } from '@/lib/utils'

const nativeSelectClass =
  'h-8 w-40 rounded-md border border-input bg-transparent px-2 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function WorkOrderStageChecklist({
  workOrderId,
  stages,
  profiles,
  isAdmin,
  currentProfileId,
}: {
  workOrderId: string
  stages: WorkOrderStage[]
  profiles: Profile[]
  isAdmin: boolean
  currentProfileId: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Record<string, string>>({})
  const router = useRouter()

  const stageByEtapa = new Map(stages.map((s) => [s.etapa, s]))

  function handleComplete(etapa: WorkOrderEtapa) {
    const profileId = selected[etapa] || currentProfileId || null
    startTransition(async () => {
      const result = await completeWorkOrderStage(workOrderId, etapa, profileId)
      if (result.ok) {
        toast.success(`${WORK_ORDER_ETAPA_INFO[etapa].label} completada`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUndo(etapa: WorkOrderEtapa) {
    startTransition(async () => {
      const result = await undoWorkOrderStage(workOrderId, etapa)
      if (result.ok) {
        toast.success(`${WORK_ORDER_ETAPA_INFO[etapa].label} revertida`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <span className="text-xs font-semibold text-foreground">Etapas del pipeline</span>
      {WORK_ORDER_ETAPAS.map((etapa) => {
        const info = WORK_ORDER_ETAPA_INFO[etapa]
        const done = stageByEtapa.get(etapa)
        const locked = info.reservada && !isAdmin

        return (
          <div key={etapa} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              {done ? (
                <CheckCircle2 className="size-4 text-status-finalizada" />
              ) : locked ? (
                <Lock className="size-4 text-muted-foreground" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
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
                className="h-7 text-xs"
                disabled={pending || (info.reservada && !isAdmin)}
                onClick={() => handleUndo(etapa)}
              >
                Deshacer
              </Button>
            ) : locked ? (
              <span className="text-[11px] text-muted-foreground">Solo coordinador</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <select
                  className={nativeSelectClass}
                  value={selected[etapa] ?? currentProfileId ?? ''}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [etapa]: e.target.value }))
                  }
                >
                  <option value="">Sin asignar</option>
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
                  disabled={pending}
                  onClick={() => handleComplete(etapa)}
                >
                  Marcar hecho
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
