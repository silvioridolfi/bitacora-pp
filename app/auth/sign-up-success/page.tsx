import { MailCheckIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-primary p-6 md:p-10">
      <div className="w-full max-w-sm">
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
              Te enviamos un correo de confirmación. Revisá tu bandeja de entrada (y
              spam) y hacé clic en el enlace para activar tu cuenta antes de iniciar
              sesión.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
