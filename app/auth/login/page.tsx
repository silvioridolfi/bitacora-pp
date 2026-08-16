'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

// Solo se genericiza la señal de credenciales/existencia. Los errores que el
// usuario puede corregir se muestran tal cual, y lo inesperado se reporta como tal.
function loginErrorMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }

  if (code === 'email_not_confirmed') {
    return 'Confirmá tu email antes de iniciar sesión — revisá tu bandeja de entrada.'
  }
  if (code === 'over_request_rate_limit' || status === 429) {
    return 'Demasiados intentos. Esperá un momento y volvé a intentar.'
  }
  if (code === 'invalid_credentials') {
    return 'Email o contraseña incorrectos.'
  }
  return 'Ocurrió un error inesperado. Volvé a intentar.'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      console.error('[v0] Login error:', err)
      setError(loginErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Iniciar sesión</CardTitle>
          <CardDescription>Ingresá con tu email y contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@escuela.edu.ar"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Spinner data-icon="inline-start" />}
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </FieldGroup>
            <FieldDescription className="mt-4 text-center">
              ¿No tenés cuenta?{' '}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Registrate
              </Link>
            </FieldDescription>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
