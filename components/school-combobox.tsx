'use client'

import { useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { School } from '@/lib/types'
import { cn } from '@/lib/utils'
import { searchSchools } from '@/lib/school-search'
import { escuelaCorta } from '@/lib/siglas'

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
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => searchSchools(schools, query), [schools, query])

  function handleSelect(school: School) {
    setSelected(school)
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="school_id" value={selected?.id ?? ''} required />

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground" title={selected.nombre}>
              {escuelaCorta(selected)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {selected.distrito ? `${selected.distrito} · ` : ''}
              {selected.cue ? `CUE ${selected.cue}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Cambiar escuela"
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
              setActiveIndex(-1)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nombre, distrito o CUE…"
            className="pl-8"
            role="combobox"
            aria-expanded={open && !!query.trim()}
            aria-controls="school-combobox-listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 && results[activeIndex] ? `school-option-${results[activeIndex].id}` : undefined
            }
          />
          {open && query.trim() && (
            <div
              id="school-combobox-listbox"
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
            >
              {results.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">Sin resultados.</p>
              )}
              {results.map((s, i) => (
                <button
                  key={s.id}
                  id={`school-option-${s.id}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  type="button"
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                    i === activeIndex && 'bg-muted',
                  )}
                >
                  <span className="font-medium text-foreground" title={s.nombre}>
                    {escuelaCorta(s)}
                  </span>
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
