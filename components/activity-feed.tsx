'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { WORK_ORDER_PASO_INFO } from '@/lib/types'
import type { Profile, WorkOrderPaso } from '@/lib/types'
import { formatDate, formatHoraArgentina } from '@/lib/format'
import { hasReliableCreatedAt } from '@/lib/timezone'
import { cn } from '@/lib/utils'

type ActivityEvent = {
  id: string
  clave: WorkOrderPaso
  descripcion: string | null
  completed_at: string
  profile: Profile | null
  work_order: {
    codigo: string
    tipo: string
    grupo: string | null
    equipment: { numero_serie: string } | null
  } | null
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const [query, setQuery] = useState('')
  const [grupo, setGrupo] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((e) => {
      if (grupo && e.work_order?.grupo !== grupo) return false
      if (!q) return true
      return (
        e.profile?.apellido_nombre?.toLowerCase().includes(q) ||
        e.work_order?.codigo?.toLowerCase().includes(q) ||
        e.work_order?.equipment?.numero_serie?.toLowerCase().includes(q)
      )
    })
  }, [events, query, grupo])

  const nativeSelectClass =
    'h-9 rounded-md border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por alumno, código de OT o N° de serie…"
          className="max-w-sm"
        />
        <select
          className={nativeSelectClass}
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
        >
          <option value="">Todos los grupos</option>
          <option value="Grupo 1">Grupo 1</option>
          <option value="Grupo 2">Grupo 2</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay eventos que coincidan.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {filtered.map((e) => {
            const info = WORK_ORDER_PASO_INFO[e.clave]
            return (
              <div key={e.id} className="flex items-start gap-3 p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-finalizada" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">
                      {e.profile?.apellido_nombre ?? 'Alguien'}
                    </span>{' '}
                    completó <span className="font-medium">{info?.label ?? e.clave}</span>
                    {e.descripcion && (
                      <span className="text-muted-foreground"> — {e.descripcion}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.work_order?.codigo ?? 'OT eliminada'}
                    {e.work_order?.equipment?.numero_serie &&
                      ` · ${e.work_order.equipment.numero_serie}`}
                    {e.work_order?.grupo && ` · ${e.work_order.grupo}`}
                  </p>
                </div>
                <span className={cn('shrink-0 whitespace-nowrap text-xs text-muted-foreground')}>
                  {formatDate(e.completed_at)}
                  {hasReliableCreatedAt(e.completed_at) &&
                    ` · ${formatHoraArgentina(e.completed_at)}`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
