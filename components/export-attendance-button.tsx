'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Grupo, Profile } from '@/lib/types'

export function ExportAttendanceButton({
  grupo,
  students,
}: {
  grupo: Grupo
  students: Profile[]
}) {
  const [open, setOpen] = useState(false)
  const [alcance, setAlcance] = useState<'grupo' | 'alumno'>('grupo')
  const [alumnoId, setAlumnoId] = useState(students[0]?.id ?? '')

  function handleDownload(formato: 'pdf' | 'excel') {
    const params = new URLSearchParams({ formato })
    if (alcance === 'alumno' && alumnoId) {
      params.set('alumnoId', alumnoId)
    } else {
      params.set('grupo', grupo)
    }
    window.location.href = `/api/informes/asistencia?${params.toString()}`
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Download className="size-4" data-icon="inline-start" />
            Exportar
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Exportar informe de asistencia</DialogTitle>
          <DialogDescription>Elegí qué querés incluir y en qué formato.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Alcance</label>
            <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setAlcance('grupo')}
                className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                  alcance === 'grupo'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {grupo} completo
              </button>
              <button
                type="button"
                onClick={() => setAlcance('alumno')}
                className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                  alcance === 'alumno'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Un alumno
              </button>
            </div>
          </div>

          {alcance === 'alumno' && (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="alumno-select"
              >
                Alumno
              </label>
              <select
                id="alumno-select"
                value={alumnoId}
                onChange={(e) => setAlumnoId(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.apellido_nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => handleDownload('excel')}>
            Descargar Excel
          </Button>
          <Button type="button" onClick={() => handleDownload('pdf')}>
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
