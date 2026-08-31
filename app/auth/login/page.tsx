'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const infoMessage = searchParams.get('message')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // No bloqueante: si falla el registro de actividad, no debe impedir
      // el ingreso del usuario. Se inserta directo con el cliente del
      // navegador (ya tiene la sesión recién creada en memoria) en vez de
      // pasar por una server action -- esa cookie recién seteada puede no
      // llegar todavía al servidor en este mismo instante.
      if (data.user) {
        supabase
          .from('login_events')
          .insert({
            profile_id: data.user.id,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          })
          .then(({ error: insertError }) => {
            if (insertError) console.error('[v0] No se pudo registrar el login:', insertError)
          })
      }

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
          {infoMessage && (
            <p className="mb-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {infoMessage}
            </p>
          )}
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
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Field>
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
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
