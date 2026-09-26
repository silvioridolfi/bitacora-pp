'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Lock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { setAttendance, deleteSession } from '@/lib/actions'
import { formatDate } from '@/lib/format'
import { isAttendanceLocked, isPastNineAmArgentina, todayInArgentina } from '@/lib/timezone'
import { ATTENDANCE_STATUS_STYLE, nextAttendanceStatus } from '@/lib/status'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { EstadoAsistencia, Profile, Session } from '@/lib/types'
import { cn } from '@/lib/utils'

type AttendanceMap = Record<string, EstadoAsistencia>

export function AttendanceGrid({
  students,
  sessions,
  attendance,
  isAdmin = false,
}: {
  students: Profile[]
  sessions: Session[]
  attendance: AttendanceMap
  isAdmin?: boolean
}) {
  const [optimisticAttendance, setOptimisticAttendance] = useState(attendance)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const today = todayInArgentina()
  const pastNine = isPastNineAmArgentina()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  function scrollByStep(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' })
  }

  function key(studentId: string, sessionId: string) {
    return `${studentId}:${sessionId}`
  }

  function handleClick(studentId: string, session: Session) {
    if (!isAdmin && isAttendanceLocked(session.fecha)) return
    const allowPresente = isAdmin || !(session.fecha === today && pastNine)
    const current = optimisticAttendance[key(studentId, session.id)] ?? null
    const next = nextAttendanceStatus(current, allowPresente)

    setOptimisticAttendance((prev) => {
      const copy = { ...prev }
      if (next) copy[key(studentId, session.id)] = next
      else delete copy[key(studentId, session.id)]
      return copy
    })
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

  function handleDeleteFecha(session: Session) {
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
      <div className="flex justify-end gap-1 sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={() => scrollByStep(-1)}
          aria-label="Desplazar hacia la izquierda"
          title="Desplazar hacia la izquierda"
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={() => scrollByStep(1)}
          aria-label="Desplazar hacia la derecha"
          title="Desplazar hacia la derecha"
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      <div ref={scrollRef} className="overflow-x-auto rounded-xl border border-border bg-card">
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
            {sessions.length > 0 && (
              <tr className="border-b border-border bg-muted/30">
                <th className="sticky left-0 z-10 bg-muted/30 px-3 py-2 text-left font-medium text-foreground">
                  Total (hs)
                </th>
                {students.map((student) => (
                  <th
                    key={student.id}
                    className="min-w-20 px-1 py-2 text-center text-sm font-semibold text-foreground"
                  >
                    {horasAcreditadas(student.id)}h
                  </th>
                ))}
              </tr>
            )}
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
                      <span>Sesión #{s.sesion_n}</span>
                      {(locked || closedButEditable) && (
                        <Lock className="size-3 text-muted-foreground" />
                      )}
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <button
                                type="button"
                                aria-label={`Borrar Sesión #${s.sesion_n}`}
                                title="Borrar esta sesión"
                                className="ml-auto text-muted-foreground hover:text-destructive"
                              />
                            }
                          >
                            <Trash2 className="size-3" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Borrar la Sesión #{s.sesion_n} ({formatDate(s.fecha)})?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Se borra también la asistencia y los roles de ese día, y se
                                desvinculan las OT que estaban asociadas a esta sesión. No se
                                puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDeleteFecha(s)}
                              >
                                Borrar sesión
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                            aria-label={`${student.apellido_nombre} -- Sesión #${s.sesion_n}: ${
                              locked ? 'fecha cerrada' : (estado ?? 'sin registrar')
                            }`}
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
        </table>
      </div>
    </div>
  )
}
