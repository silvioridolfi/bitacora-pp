'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
    <div className="flex min-h-svh w-full flex-col bg-primary">
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <span className="font-heading text-sm font-semibold tracking-wide text-accent uppercase">
              DTE · Región 1
            </span>
            <h1 className="font-heading text-2xl font-bold text-primary-foreground text-balance">
              Bitácora de Prácticas Profesionalizantes
            </h1>
            <p className="text-sm text-primary-foreground/70">EEST N°3</p>
          </div>
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
        </div>
      </div>
      <footer className="flex w-full items-center justify-center px-6 py-8">
        <Image
          src="/images/dgcye-pba-horizontal.png"
          alt="Dirección General de Cultura y Educación — Gobierno de la Provincia de Buenos Aires"
          width={1080}
          height={142}
          className="h-auto w-full max-w-xl sm:max-w-2xl"
          priority
        />
      </footer>
    </div>
  )
}
