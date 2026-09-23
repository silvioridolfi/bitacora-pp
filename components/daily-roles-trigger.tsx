'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DailyRolesPanel } from '@/components/daily-roles-panel'
import type { DailyRole, Profile } from '@/lib/types'

/**
 * Reemplaza al panel de Roles embebido en la página -- ese crecía con
 * cada alumno marcado presente y corría la grilla de asistencia de
 * abajo justo mientras se estaba usando. Acá el contenido vive en un
 * modal: por más que la tabla de roles crezca, la página de atrás no
 * se mueve.
 */
export function DailyRolesTrigger({
  sessionId,
  sesionN,
  presentStudents,
  roles,
}: {
  sessionId: string
  sesionN: number
  presentStudents: Profile[]
  roles: DailyRole[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="size-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Roles de hoy</span>
          <span className="text-muted-foreground">
            sesión #{sesionN} · {presentStudents.length}{' '}
            {presentStudents.length === 1 ? 'presente' : 'presentes'}
          </span>
        </div>
        <DialogTrigger render={<Button type="button" size="sm" />}>Asignar roles</DialogTrigger>
      </div>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Roles -- sesión #{sesionN} (hoy)</DialogTitle>
          <DialogDescription>
            Se asignan solo entre los alumnos ya marcados presentes o con tardanza.
          </DialogDescription>
        </DialogHeader>
        <DailyRolesPanel sessionId={sessionId} presentStudents={presentStudents} roles={roles} />
      </DialogContent>
    </Dialog>
  )
}
