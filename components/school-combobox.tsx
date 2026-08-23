'use client'

import { useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { School } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SchoolCombobox({
  schools,
  defaultSchool,
}: {
  schools: School[]
  defaultSchool?: School | null
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<School | null>(defaultSchool ?? null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return schools
      .filter(
        (s) =>
          s.nombre?.toLowerCase().includes(q) ||
          s.distrito?.toLowerCase().includes(q) ||
          s.nombre_completo?.toLowerCase().includes(q) ||
          String(s.cue ?? '').includes(q),
      )
      .slice(0, 20)
  }, [schools, query])

  function handleSelect(school: School) {
    setSelected(school)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="school_id" value={selected?.id ?? ''} required />

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{selected.nombre}</p>
            <p className="truncate text-xs text-muted-foreground">
              {selected.distrito ? `${selected.distrito} · ` : ''}
              {selected.cue ? `CUE ${selected.cue}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
            title="Cambiar escuela"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar por nombre, distrito o CUE…"
            className="pl-8"
          />
          {open && query.trim() && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {results.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">Sin resultados.</p>
              )}
              {results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                  )}
                >
                  <span className="font-medium text-foreground">{s.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.distrito ? `${s.distrito} · ` : ''}
                    {s.cue ? `CUE ${s.cue}` : 'Sin CUE'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
