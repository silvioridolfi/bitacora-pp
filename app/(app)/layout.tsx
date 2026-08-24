import { redirect } from 'next/navigation'
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
        <header
          className="relative flex h-14 shrink-0 items-center gap-2 overflow-hidden border-b border-border bg-card bg-[url('/images/bk-2-practicas-profesionalizantes-dte.png')] bg-cover bg-right px-4"
        >
          <div className="absolute inset-0 bg-card/85" />
          <div className="relative flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-semibold text-foreground">
                DTE · Región 1
              </span>
            </div>
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
