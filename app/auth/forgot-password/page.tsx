'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })
      if (error) {
        setError('No pudimos enviar el correo. Verificá el email e intentá de nuevo.')
        return
      }
      setSent(true)
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
          <CardTitle className="font-heading text-xl">Recuperar contraseña</CardTitle>
          <CardDescription>
            {sent
              ? 'Si el email existe en el sistema, te llegó un enlace para elegir una nueva contraseña.'
              : 'Ingresá el email con el que iniciás sesión y te mandamos un enlace para recuperarla.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <Link href="/auth/login" className="text-sm text-primary underline-offset-2 hover:underline">
              Volver a iniciar sesión
            </Link>
          ) : (
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </Field>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner className="size-4" /> : 'Enviar enlace'}
                </Button>
                <Link
                  href="/auth/login"
                  className="text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
                >
                  Volver a iniciar sesión
                </Link>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  )
}
