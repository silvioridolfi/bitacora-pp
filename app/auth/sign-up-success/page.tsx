import { MailCheckIcon } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-accent/10">
            <MailCheckIcon className="size-5 text-accent" />
          </div>
          <CardTitle className="font-heading text-xl">¡Registro exitoso!</CardTitle>
          <CardDescription>Confirmá tu email para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Te enviamos un correo de confirmación
            {email ? (
              <>
                {' '}
                a <span className="font-medium text-foreground">{email}</span>
              </>
            ) : null}
            . Revisá tu bandeja de entrada (y spam) y hacé clic en el enlace
            para activar tu cuenta antes de iniciar sesión.
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
