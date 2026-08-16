'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { setAttendance } from '@/lib/actions'
import { formatDateShort } from '@/lib/format'
import { ATTENDANCE_STATUS_STYLE, nextAttendanceStatus } from '@/lib/status'
import type { EstadoAsistencia, Profile, Session } from '@/lib/types'
import { cn } from '@/lib/utils'

type AttendanceMap = Record<string, EstadoAsistencia>

export function AttendanceGrid({
  students,
  sessions,
  attendance,
}: {
  students: Profile[]
  sessions: Session[]
  attendance: AttendanceMap
}) {
  const [optimisticAttendance, setOptimisticAttendance] = useOptimistic(attendance)
  const [, startTransition] = useTransition()

  function key(studentId: string, sessionId: string) {
    return `${studentId}:${sessionId}`
  }

  function handleClick(studentId: string, sessionId: string) {
    const current = optimisticAttendance[key(studentId, sessionId)] ?? 'Presente'
    const next = nextAttendanceStatus(current)

    startTransition(async () => {
      setOptimisticAttendance((prev) => ({
        ...prev,
        [key(studentId, sessionId)]: next,
      }))
      const result = await setAttendance(studentId, sessionId, next)
      if (!result.ok) {
        toast.error(result.error)
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

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-muted-foreground">
              Estudiante
            </th>
            {sessions.map((s) => (
              <th
                key={s.id}
                className="min-w-14 px-1 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                <div>#{s.sesion_n}</div>
                <div className="text-[10px]">{formatDateShort(s.fecha)}</div>
              </th>
            ))}
            <th className="min-w-20 px-3 py-2 text-center font-medium text-muted-foreground">
              Horas
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-border last:border-0">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground">
                {student.apellido_nombre}
              </td>
              {sessions.map((s) => {
                const estado = optimisticAttendance[key(student.id, s.id)] ?? null
                const style = estado ? ATTENDANCE_STATUS_STYLE[estado] : null
                return (
                  <td key={s.id} className="p-1 text-center">
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
              <td className="px-3 py-2 text-center font-medium text-foreground">
                {horasAcreditadas(student.id)}h
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
