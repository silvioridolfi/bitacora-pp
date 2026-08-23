'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { setAttendance, createSession, deleteSession } from '@/lib/actions'
import { formatDate } from '@/lib/format'
import { isAttendanceLocked, isPastNineAmArgentina, todayInArgentina } from '@/lib/timezone'
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
  isAdmin = false,
}: {
  grupo: Grupo
  students: Profile[]
  sessions: Session[]
  attendance: AttendanceMap
  isAdmin?: boolean
}) {
  const [optimisticAttendance, setOptimisticAttendance] = useState(attendance)
  const [pending, startTransition] = useTransition()
  const [newFecha, setNewFecha] = useState(todayInArgentina())
  const router = useRouter()
  const today = todayInArgentina()
  const pastNine = isPastNineAmArgentina()

  function key(studentId: string, sessionId: string) {
    return `${studentId}:${sessionId}`
  }

  function handleClick(studentId: string, session: Session) {
    if (!isAdmin && isAttendanceLocked(session.fecha)) return
    const allowPresente = isAdmin || !(session.fecha === today && pastNine)
    const current = optimisticAttendance[key(studentId, session.id)] ?? null
    const next = nextAttendanceStatus(current, allowPresente)

    setOptimisticAttendance((prev) => ({ ...prev, [key(studentId, session.id)]: next }))
    startTransition(async () => {
      const result = await setAttendance(studentId, session.id, next)
      if (!result.ok) {
        toast.error(result.error)
        setOptimisticAttendance((prev) => {
          const copy = { ...prev }
          if (current) copy[key(studentId, session.id)] = current
          else delete copy[key(studentId, session.id)]
          return copy
        })
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
      const result = await createSession(grupo, newFecha)
      if (result.ok) {
        toast.success('Fecha agregada (4hs)')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDeleteFecha(session: Session) {
    if (
      !confirm(
        `¿Borrar la fecha #${session.sesion_n} (${formatDate(session.fecha)})? Se borra también la asistencia y los roles de ese día. No se puede deshacer.`,
      )
    )
      return
    startTransition(async () => {
      const result = await deleteSession(session.id)
      if (result.ok) {
        toast.success('Fecha borrada')
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
            Nueva fecha (4hs)
          </label>
          <Input
            id="new-fecha"
            type="date"
            value={newFecha}
            onChange={(e) => setNewFecha(e.target.value)}
            className="h-9 w-40"
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
            {sessions.map((s) => {
              const allowPresente = isAdmin || !(s.fecha === today && pastNine)
              const locked = !isAdmin && isAttendanceLocked(s.fecha)
              const closedButEditable = isAdmin && isAttendanceLocked(s.fecha)
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground">
                    <div className="flex items-center gap-1">
                      <span>#{s.sesion_n}</span>
                      {(locked || closedButEditable) && (
                        <Lock className="size-3 text-muted-foreground" />
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          title="Borrar esta fecha"
                          onClick={() => handleDeleteFecha(s)}
                          className="ml-auto text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDate(s.fecha)}
                    </div>
                    {!locked && !closedButEditable && !allowPresente && (
                      <div className="text-[10px] text-status-tardanza">
                        Después de las 9:00
                      </div>
                    )}
                    {locked && (
                      <div className="text-[10px] text-muted-foreground">Cerrada</div>
                    )}
                    {closedButEditable && (
                      <div className="text-[10px] text-primary">
                        Cerrada -- editable (admin)
                      </div>
                    )}
                  </td>
                  {students.map((student) => {
                    const estado = optimisticAttendance[key(student.id, s.id)] ?? null
                    const style = estado ? ATTENDANCE_STATUS_STYLE[estado] : null
                    return (
                      <td key={student.id} className="p-1">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleClick(student.id, s)}
                            disabled={locked}
                            title={
                              locked
                                ? 'Fecha cerrada -- no se puede modificar'
                                : (estado ?? 'Sin registrar (click para marcar)')
                            }
                            className={cn(
                              'flex size-8 items-center justify-center rounded-md border text-[10px] font-semibold transition-colors',
                              locked && 'cursor-not-allowed opacity-60',
                              style
                                ? cn(style.bg, style.border, style.text)
                                : 'border-border bg-transparent text-muted-foreground hover:bg-muted',
                            )}
                          >
                            {estado ? estado.slice(0, 1) : '—'}
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
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
