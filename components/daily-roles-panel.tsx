'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { assignDailyRole, removeDailyRole } from '@/lib/actions'
import { DAILY_ROLES, EXCLUSIVE_DAILY_ROLES } from '@/lib/types'
import type { DailyRole, DailyRoleName, Profile } from '@/lib/types'

const nativeSelectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function DailyRolesPanel({
  sessionId,
  presentStudents,
  roles,
}: {
  sessionId: string
  presentStudents: Profile[]
  roles: DailyRole[]
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const holderOf = (rol: DailyRoleName) => roles.find((r) => r.rol === rol) ?? null
  const hasRole = (studentId: string, rol: DailyRoleName) =>
    roles.some((r) => r.student_id === studentId && r.rol === rol)

  function handleExclusiveChange(rol: DailyRoleName, studentId: string) {
    if (!studentId) return
    startTransition(async () => {
      const result = await assignDailyRole(sessionId, studentId, rol)
      if (result.ok) router.refresh()
      else toast.error(result.error)
    })
  }

  function handleToggle(studentId: string, rol: DailyRoleName, checked: boolean) {
    startTransition(async () => {
      const result = checked
        ? await assignDailyRole(sessionId, studentId, rol)
        : await removeDailyRole(sessionId, studentId, rol)
      if (result.ok) router.refresh()
      else toast.error(result.error)
    })
  }

  if (presentStudents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Marcá la asistencia primero -- los roles del día solo se asignan entre los presentes.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold text-foreground">Roles de hoy</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {EXCLUSIVE_DAILY_ROLES.map((rol) => {
          const holder = holderOf(rol)
          return (
            <div key={rol} className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{rol}</label>
              <select
                className={nativeSelectClass}
                value={holder?.student_id ?? ''}
                disabled={pending}
                onChange={(e) => handleExclusiveChange(rol, e.target.value)}
              >
                <option value="">Sin asignar</option>
                {presentStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.apellido_nombre}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                Alumno
              </th>
              {DAILY_ROLES.filter((r) => !EXCLUSIVE_DAILY_ROLES.includes(r)).map((rol) => (
                <th
                  key={rol}
                  className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {rol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {presentStudents.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-2 py-2 text-foreground">{s.apellido_nombre}</td>
                {DAILY_ROLES.filter((r) => !EXCLUSIVE_DAILY_ROLES.includes(r)).map((rol) => (
                  <td key={rol} className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      disabled={pending}
                      checked={hasRole(s.id, rol)}
                      onChange={(e) => handleToggle(s.id, rol, e.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
