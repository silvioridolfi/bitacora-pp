import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SessionGuard } from '@/components/session-guard'
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
      <SessionGuard isAdmin={profile?.is_admin ?? false} />
      <AppSidebar
        apellidoNombre={profile?.apellido_nombre ?? email}
        isAdmin={profile?.is_admin ?? false}
      />
      <SidebarInset>
        <header
          className="relative flex h-16 shrink-0 items-center overflow-hidden px-4 sm:h-20"
          style={{
            background: 'linear-gradient(135deg, #03466e 0%, #623b75 55%, #cd2b7b 100%)',
          }}
        >
          <div
            aria-hidden
            className="absolute -right-3 top-1/2 hidden size-8 -translate-y-1/2 rotate-45 rounded-md border-[5px] border-accent sm:block"
          />
          <div className="absolute left-4 flex items-center gap-2">
            <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" />
            <Separator orientation="vertical" className="h-4 bg-white/30" />
            <span className="hidden font-heading text-sm font-semibold text-white sm:inline">
              DTE · Región 1
            </span>
          </div>
          <div className="mx-auto flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-3">
            <h1 className="font-heading text-sm font-bold leading-tight text-white sm:text-base">
              Prácticas Educativas en Ambientes de Trabajo
            </h1>
            <span className="hidden rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-accent-foreground sm:inline-block">
              Dirección de Tecnología Educativa
            </span>
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">{children}</div>
        </div>
        <footer className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground md:px-6">
          <div className="mx-auto w-full max-w-[1600px]">
            © {new Date().getFullYear()} Dirección de Tecnología Educativa (DTE), Región 1 ·
            Desarrollado por Silvio Ridolfi, Facilitador de Educación Digital
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
