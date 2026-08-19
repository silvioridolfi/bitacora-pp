'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/spinner'

const requirements = [
  { label: '8 caracteres como mínimo', test: (value: string) => value.length >= 8 },
  { label: 'Una letra mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Una letra minúscula', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Un número', test: (value: string) => /\d/.test(value) },
  { label: 'Un símbolo (!@#$%^&*)', test: (value: string) => /[!@#$%^&*]/.test(value) },
]

export default function ChangePasswordRequiredPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checks = useMemo(
    () => requirements.map((requirement) => requirement.test(newPassword)),
    [newPassword],
  )
  const isStrong = checks.every(Boolean)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!isStrong) {
      setError('La nueva contraseña no cumple todos los requisitos.')
      return
    }
    if (newPassword !== confirmation) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser diferente de la contraseña inicial.')
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      setError('Tu sesión expiró. Volvé a iniciar sesión.')
      setIsLoading(false)
      return
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (verifyError) {
      setError('La contraseña inicial no es correcta.')
      setIsLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setError('No se pudo actualizar la contraseña. Volvé a intentar.')
      setIsLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ password_change_required: false })
      .eq('id', user.id)

    if (profileError) {
      setError('La contraseña cambió, pero no pudimos completar tu perfil. Contactá al administrador.')
      setIsLoading(false)
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Creá tu nueva contraseña</CardTitle>
          <CardDescription>
            Por seguridad, reemplazá tu DNI antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="current-password">DNI original</FieldLabel>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </Field>
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
                {requirements.map((requirement, index) => (
                  <li key={requirement.label} className={checks[index] ? 'text-emerald-600' : ''}>
                    {checks[index] ? 'Cumple: ' : 'Falta: '}{requirement.label}
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
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Spinner data-icon="inline-start" />}
                {isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

export const dynamic = 'force-dynamic'

