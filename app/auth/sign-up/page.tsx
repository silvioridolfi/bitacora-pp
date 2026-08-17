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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

function signUpErrorMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }

  if (code === 'weak_password') {
    return 'Elegí una contraseña más segura.'
  }
  if (code === 'email_address_invalid') {
    return 'Usá un email real — no se aceptan dominios de ejemplo.'
  }
  if (code === 'email_address_not_authorized') {
    return 'No pudimos enviar el email de confirmación a esa dirección. Probá con otra.'
  }
  if (code === 'validation_failed') {
    return 'Revisá los datos ingresados.'
  }
  if (code === 'over_email_send_rate_limit' || status === 429) {
    return 'Demasiados intentos. Esperá un momento y volvé a intentar.'
  }
  return 'No se pudo completar el registro. Volvé a intentar.'
}

export default function SignUpPage() {
  const [apellido, setApellido] = useState('')
  const [nombre, setNombre] = useState('')
  const [grupo, setGrupo] = useState<string>('')
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setError('Los emails no coinciden.')
      return
    }
    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!grupo) {
      setError('Seleccioná tu grupo.')
      return
    }

    const apellidoNombre = `${apellido.trim()}, ${nombre.trim()}`
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            apellido_nombre: apellidoNombre,
            grupo,
            is_admin: false,
          },
        },
      })
      if (error) throw error
      router.push(
        `/auth/sign-up-success?email=${encodeURIComponent(email.trim())}`
      )
    } catch (err: unknown) {
      console.error('[v0] Sign-up error:', err)
      setError(signUpErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Crear cuenta</CardTitle>
            <CardDescription>Registrate para acceder a la bitácora</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
                    <Input
                      id="apellido"
                      placeholder="Pérez"
                      required
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                    <Input
                      id="nombre"
                      placeholder="Juan"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="grupo">Grupo</FieldLabel>
                  <Select value={grupo} onValueChange={(value) => setGrupo(value ?? '')}>
                    <SelectTrigger id="grupo" className="w-full">
                      <SelectValue placeholder="Seleccioná tu grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Grupo 1">Grupo 1</SelectItem>
                        <SelectItem value="Grupo 2">Grupo 2</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <FieldSeparator />

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
                  <FieldLabel htmlFor="confirm-email">Confirmar email</FieldLabel>
                  <Input
                    id="confirm-email"
                    type="email"
                    placeholder="nombre@escuela.edu.ar"
                    required
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
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
                <Field>
                  <FieldLabel htmlFor="repeat-password">Repetir contraseña</FieldLabel>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </Field>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Spinner data-icon="inline-start" />}
                  {isLoading ? 'Creando cuenta...' : 'Registrarme'}
                </Button>
              </FieldGroup>
              <FieldDescription className="mt-4 text-center">
                ¿Ya tenés cuenta?{' '}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Iniciar sesión
                </Link>
              </FieldDescription>
            </form>
          </CardContent>
      </Card>
    </AuthShell>
  )
}
