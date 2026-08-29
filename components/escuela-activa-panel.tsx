'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setEscuelaActiva } from '@/lib/actions'
import { useRealtimeEscuelaActiva } from '@/hooks/use-realtime-escuela-activa'
import type { EscuelaActiva, Grupo, School } from '@/lib/types'

export function EscuelaActivaPanel({
  grupo,
  escuelaActiva,
  schools,
}: {
  grupo: Grupo
  escuelaActiva: EscuelaActiva | null
  schools: School[]
}) {
  const [editing, setEditing] = useState(!escuelaActiva?.school)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  useRealtimeEscuelaActiva()

  function handleSelect(schoolId: string) {
    startTransition(async () => {
      const result = await setEscuelaActiva(grupo, schoolId)
      if (result.ok) {
        toast.success('Escuela activa actualizada')
        setEditing(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (!editing && escuelaActiva?.school) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 shrink-0 text-primary" />
          <div>
            <span className="text-muted-foreground">Trabajando hoy en </span>
            <span className="font-semibold text-foreground">{escuelaActiva.school.nombre}</span>
            {escuelaActiva.updated_by_profile && (
              <span className="text-muted-foreground">
                {' '}
                · fijada por {escuelaActiva.updated_by_profile.apellido_nombre}
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          disabled={pending}
        >
          <X className="size-3.5" data-icon="inline-start" />
          Cambiar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-border p-3">
      <label className="text-xs font-medium text-muted-foreground">
        Escuela en la que están trabajando hoy (se precarga sola en cada OT nueva)
      </label>
      <div className="flex gap-2">
        <div className="max-w-sm flex-1">
          <ActiveSchoolPicker schools={schools} onSelect={handleSelect} disabled={pending} />
        </div>
        {escuelaActiva?.school && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}

/** SchoolCombobox está pensado para vivir dentro de un <form> (usa un
 * input hidden), así que acá reimplemento el mismo buscador pero
 * disparando la selección directo, sin depender de un submit. */
function ActiveSchoolPicker({
  schools,
  onSelect,
  disabled,
}: {
  schools: School[]
  onSelect: (schoolId: string) => void
  disabled: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = query.trim()
    ? schools
        .filter(
          (s) =>
            s.nombre?.toLowerCase().includes(query.toLowerCase()) ||
            s.distrito?.toLowerCase().includes(query.toLowerCase()) ||
            String(s.cue ?? '').includes(query),
        )
        .slice(0, 20)
    : []

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
        placeholder="Buscar por nombre, distrito o CUE…"
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
              onClick={() => {
                onSelect(s.id)
                setQuery('')
                setOpen(false)
              }}
              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
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
  )
}
