'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarCheck,
  LayoutDashboard,
  Laptop,
  Trophy,
  KanbanSquare,
  Wrench,
  MapPin,
  LogOut,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/asistencia', label: 'Asistencia', icon: CalendarCheck },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/equipos', label: 'Equipos', icon: Laptop },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/tablero', label: 'Tablero', icon: KanbanSquare },
  { href: '/taller', label: 'Taller', icon: Wrench },
  { href: '/territorio', label: 'Territorio', icon: MapPin },
]

export function AppSidebar({
  apellidoNombre,
  isAdmin,
}: {
  apellidoNombre: string | null
  isAdmin: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 border-b border-sidebar-border px-3 py-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-heading text-sm font-bold text-sidebar-primary-foreground">
            PP
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-bold tracking-tight">
              Bitácora PP
            </span>
            <span className="text-[11px] text-sidebar-foreground/70">
              DTE · Región 1
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {apellidoNombre ?? 'Sin perfil'}
            </span>
            <span className="text-[11px] text-sidebar-foreground/70">
              {isAdmin ? 'Coordinador FED' : 'Estudiante'}
            </span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar sesión">
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
