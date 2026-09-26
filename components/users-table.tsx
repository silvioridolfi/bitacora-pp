'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resetStudentPassword } from '@/lib/actions'
import type { Profile } from '@/lib/types'

export function UsersTable({
  profiles,
  emailById,
}: {
  profiles: Profile[]
  emailById: Record<string, string>
}) {
  const [target, setTarget] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [pending, startTransition] = useTransition()
  const hasEmails = Object.keys(emailById).length > 0

  function handleReset() {
    if (!target) return
    startTransition(async () => {
      const result = await resetStudentPassword(target.id, newPassword)
      if (result.ok) {
        toast.success(`Contraseña de ${target.apellido_nombre} actualizada`)
        setTarget(null)
        setNewPassword('')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {!hasEmails && (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          Falta configurar la Service Role Key para poder ver emails y resetear
          contraseñas desde acá -- mientras tanto, solo se muestra el listado.
        </p>
      )}
      {/* Mobile: cards en vez de una tabla de 5 columnas con scroll
          horizontal -- el email largo y el botón de acción entran
          mejor así que apretados en una fila. */}
      <div className="flex flex-col gap-2 sm:hidden">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {p.is_admin ? (
                    p.apellido_nombre
                  ) : (
                    <Link href={`/alumnos/${p.id}`} className="hover:underline">
                      {p.apellido_nombre}
                    </Link>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {emailById[p.id] || 'Sin email'}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {p.is_admin ? 'FED' : 'Alumno'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{p.grupo ?? 'Sin grupo'}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasEmails}
                onClick={() => {
                  setTarget(p)
                  setNewPassword('')
                }}
              >
                <KeyRound className="size-3.5" data-icon="inline-start" />
                Resetear contraseña
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Grupo</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium text-foreground">
                  {p.is_admin ? (
                    p.apellido_nombre
                  ) : (
                    <Link href={`/alumnos/${p.id}`} className="hover:underline">
                      {p.apellido_nombre}
                    </Link>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{p.grupo ?? '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {emailById[p.id] || '—'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {p.is_admin ? 'FED' : 'Alumno'}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasEmails}
                    onClick={() => {
                      setTarget(p)
                      setNewPassword('')
                    }}
                  >
                    <KeyRound className="size-3.5" data-icon="inline-start" />
                    Resetear contraseña
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Resetear contraseña de {target?.apellido_nombre}
            </DialogTitle>
            <DialogDescription>
              Va a tener que cambiarla apenas entre con esta contraseña nueva. Si no
              sabés qué poner, usá su DNI -- es el mismo criterio que se usa al dar de
              alta a alguien.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña (mínimo 6 caracteres)"
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              disabled={pending || newPassword.length < 6}
            >
              {pending ? 'Actualizando…' : 'Actualizar contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
