'use client'

import { useState } from 'react'
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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
  const [apellidoNombre, setApellidoNombre] = useState('')
  const [grupo, setGrupo] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!isAdmin && !grupo) {
      setError('Seleccioná tu grupo.')
      return
    }

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
            grupo: isAdmin ? null : grupo,
            is_admin: isAdmin,
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (err: unknown) {
      console.error('[v0] Sign-up error:', err)
      setError(signUpErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-primary p-6 md:p-10">
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
            <CardTitle className="font-heading text-xl">Crear cuenta</CardTitle>
            <CardDescription>Registrate para acceder a la bitácora</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="apellido-nombre">Apellido y nombre</FieldLabel>
                  <Input
                    id="apellido-nombre"
                    placeholder="Pérez, Juan"
                    required
                    value={apellidoNombre}
                    onChange={(e) => setApellidoNombre(e.target.value)}
                  />
                </Field>

                <Field data-disabled={isAdmin || undefined}>
                  <FieldLabel htmlFor="grupo">Grupo</FieldLabel>
                  <Select
                    value={grupo}
                    onValueChange={(value) => setGrupo(value ?? '')}
                    disabled={isAdmin}
                  >
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

                <Field orientation="horizontal">
                  <Checkbox
                    id="is-admin"
                    checked={isAdmin}
                    onCheckedChange={(checked) => setIsAdmin(checked === true)}
                  />
                  <FieldLabel htmlFor="is-admin" className="font-normal">
                    Soy coordinador/a FED (administrador)
                  </FieldLabel>
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
      </div>
    </div>
  )
}
