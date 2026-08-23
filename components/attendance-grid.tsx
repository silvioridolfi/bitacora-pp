'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { setAttendance, createSession } from '@/lib/actions'
import { formatDate } from '@/lib/format'
import { todayInArgentina } from '@/lib/timezone'
import { ATTENDANCE_STATUS_STYLE, nextAttendanceStatus } from '@/lib/status'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { EstadoAsistencia, Grupo, Profile, Session } from '@/lib/types'
import { cn } from '@/lib/utils'

type AttendanceMap = Record<string, EstadoAsistencia>

export function AttendanceGrid({
  grupo,
  students,
  sessions,
  attendance,
}: {
  grupo: Grupo
  students: Profile[]
  sessions: Session[]
  attendance: AttendanceMap
}) {
  const [optimisticAttendance, setOptimisticAttendance] = useState(attendance)
  const [pending, startTransition] = useTransition()
  const [newFecha, setNewFecha] = useState(todayInArgentina())
  const [newHoras, setNewHoras] = useState('4')
  const router = useRouter()

  function key(studentId: string, sessionId: string) {
    return `${studentId}:${sessionId}`
  }

  function handleClick(studentId: string, sessionId: string) {
    const current = optimisticAttendance[key(studentId, sessionId)] ?? 'Presente'
    const next = nextAttendanceStatus(current)

    setOptimisticAttendance((prev) => ({ ...prev, [key(studentId, sessionId)]: next }))
    startTransition(async () => {
      const result = await setAttendance(studentId, sessionId, next)
      if (!result.ok) {
        toast.error(result.error)
        setOptimisticAttendance((prev) => ({ ...prev, [key(studentId, sessionId)]: current }))
      }
    })
  }

  function horasAcreditadas(studentId: string) {
    return sessions.reduce((acc, s) => {
      const estado = optimisticAttendance[key(studentId, s.id)]
      if (estado === 'Presente' || estado === 'Tardanza') return acc + s.horas
      return acc
    }, 0)
  }

  function handleAddFecha() {
    if (!newFecha) return
    startTransition(async () => {
      const result = await createSession(grupo, newFecha, Number(newHoras) || 0)
      if (result.ok) {
        toast.success('Fecha agregada')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground" htmlFor="new-fecha">
            Nueva fecha
          </label>
          <Input
            id="new-fecha"
            type="date"
            value={newFecha}
            onChange={(e) => setNewFecha(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground" htmlFor="new-horas">
            Horas
          </label>
          <Input
            id="new-horas"
            type="number"
            step="0.5"
            min="0"
            value={newHoras}
            onChange={(e) => setNewHoras(e.target.value)}
            className="h-9 w-24"
          />
        </div>
        <Button type="button" size="sm" disabled={pending} onClick={handleAddFecha}>
          <Plus className="size-4" data-icon="inline-start" />
          Agregar fecha
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-muted-foreground">
                Fecha
              </th>
              {students.map((student) => (
                <th
                  key={student.id}
                  className="min-w-20 px-1 py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {student.apellido_nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground">
                  <div>#{s.sesion_n}</div>
                  <div className="text-[11px] text-muted-foreground">{formatDate(s.fecha)}</div>
                </td>
                {students.map((student) => {
                  const estado = optimisticAttendance[key(student.id, s.id)] ?? null
                  const style = estado ? ATTENDANCE_STATUS_STYLE[estado] : null
                  return (
                    <td key={student.id} className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleClick(student.id, s.id)}
                        title={estado ?? 'Sin registrar (click para marcar)'}
                        className={cn(
                          'flex size-8 items-center justify-center rounded-md border text-[10px] font-semibold transition-colors',
                          style
                            ? cn(style.bg, style.border, style.text)
                            : 'border-border bg-transparent text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {estado ? estado.slice(0, 1) : '—'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td
                  colSpan={students.length + 1}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Todavía no hay fechas cargadas. Agregá la primera arriba.
                </td>
              </tr>
            )}
          </tbody>
          {sessions.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td className="sticky left-0 z-10 bg-muted/30 px-3 py-2 font-medium text-foreground">
                  Horas
                </td>
                {students.map((student) => (
                  <td
                    key={student.id}
                    className="px-1 py-2 text-center font-medium text-foreground"
                  >
                    {horasAcreditadas(student.id)}h
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
