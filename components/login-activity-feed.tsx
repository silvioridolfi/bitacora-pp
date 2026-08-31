'use client'

import { useMemo, useState } from 'react'
import { LogIn } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { LoginEvent } from '@/lib/types'
import { formatDate, formatHoraArgentina } from '@/lib/format'
import { hasReliableCreatedAt } from '@/lib/timezone'

export function LoginActivityFeed({ events }: { events: LoginEvent[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return events
    return events.filter((e) => e.profile?.apellido_nombre?.toLowerCase().includes(q))
  }, [events, query])

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por alumno…"
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay inicios de sesión que coincidan.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {filtered.map((e) => (
            <div key={e.id} className="flex items-start gap-3 p-3">
              <LogIn className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">
                    {e.profile?.apellido_nombre ?? 'Alguien'}
                  </span>{' '}
                  inició sesión
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(e.logged_in_at)}
                {hasReliableCreatedAt(e.logged_in_at) &&
                  ` · ${formatHoraArgentina(e.logged_in_at)}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
