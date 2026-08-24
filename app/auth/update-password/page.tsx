'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { PASSWORD_REQUIREMENTS } from '@/lib/password-requirements'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checks = useMemo(
    () => PASSWORD_REQUIREMENTS.map((requirement) => requirement.test(newPassword)),
    [newPassword],
  )
  const isStrong = checks.every(Boolean)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!isStrong) {
      setError('La contraseña no cumple todos los requisitos.')
      return
    }
    if (newPassword !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('El enlace expiró o ya se usó. Pedí uno nuevo desde "Olvidé mi contraseña".')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError('No se pudo actualizar la contraseña. Volvé a intentar.')
        return
      }

      // Si todavía tenía pendiente el cambio de la clave inicial, esto ya lo cumple.
      await supabase.from('profiles').update({ password_change_required: false }).eq('id', user.id)

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setError('Ocurrió un error inesperado. Volvé a intentar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Elegí tu nueva contraseña</CardTitle>
          <CardDescription>Tiene que cumplir todos los requisitos de seguridad.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-password">Nueva contraseña</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </Field>
              <ul className="grid gap-1 text-xs text-muted-foreground" aria-label="Requisitos de contraseña">
                {PASSWORD_REQUIREMENTS.map((requirement, index) => (
                  <li key={requirement.label} className={checks[index] ? 'text-emerald-600' : ''}>
                    {checks[index] ? 'Cumple: ' : 'Falta: '}
                    {requirement.label}
                  </li>
                ))}
              </ul>
              <Field>
                <FieldLabel htmlFor="confirm-password">Confirmar contraseña</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                />
              </Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="size-4" /> : 'Guardar contraseña'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
