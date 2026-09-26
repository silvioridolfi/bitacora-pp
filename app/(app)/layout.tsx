import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SessionGuard } from '@/components/session-guard'
import { ScrollToTopButton } from '@/components/scroll-to-top-button'
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
        profileId={profile?.id ?? null}
      />
      <SidebarInset>
        <header
          className="relative grid h-16 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 overflow-hidden px-3 sm:h-20 sm:px-4"
          style={{ background: 'var(--gradient-brand-header)' }}
        >
          <div
            aria-hidden
            className="absolute -right-3 top-1/2 hidden size-8 -translate-y-1/2 rotate-45 rounded-md border-[5px] border-accent sm:block"
          />
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="shrink-0 text-white hover:bg-white/10 hover:text-white" />
            <Separator orientation="vertical" className="hidden h-4 bg-white/30 sm:block" />
            <span className="hidden font-heading text-sm font-semibold text-white sm:inline">
              DTE · Región 1
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-1 text-center">
            <h1 className="font-heading text-xs font-bold leading-tight text-white sm:text-lg lg:text-xl">
              Prácticas Educativas en Ambientes de Trabajo
            </h1>
            <span className="hidden rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-accent-foreground sm:inline-block">
              Dirección de Tecnología Educativa
            </span>
          </div>
          <div aria-hidden className="w-6 sm:w-24" />
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
        <ScrollToTopButton />
      </SidebarInset>
    </SidebarProvider>
  )
}
