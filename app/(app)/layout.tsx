import { redirect } from 'next/navigation'
import Image from 'next/image'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { getCurrentProfile } from '@/lib/data'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, email } = await getCurrentProfile()

  if (!email) {
    redirect('/auth/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar
        apellidoNombre={profile?.apellido_nombre ?? email}
        isAdmin={profile?.is_admin ?? false}
      />
      <SidebarInset>
        <header className="relative flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
          <div className="absolute left-4 flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="hidden font-heading text-sm font-semibold text-foreground sm:inline">
              DTE · Región 1
            </span>
          </div>
          <div className="mx-auto max-w-[60vw] sm:max-w-none">
            <Image
              src="/images/logo-practicas-profesionalizantes-dte.png"
              alt="Prácticas Profesionalizantes en la Dirección de Tecnología Educativa (DTE)"
              width={1920}
              height={176}
              className="h-auto max-h-10 w-auto object-contain"
              priority
            />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
        <footer className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground md:px-6">
          © {new Date().getFullYear()} Dirección de Tecnología Educativa (DTE), Región 1 ·
          Desarrollado por Silvio Ridolfi, Facilitador de Educación Digital
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
