'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  CalendarCheck,
  LayoutDashboard,
  Laptop,
  Trophy,
  KanbanSquare,
  Wrench,
  MapPin,
  History,
  Users,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/asistencia', label: 'Asistencia', icon: CalendarCheck },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/equipos', label: 'Equipos', icon: Laptop },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/tablero', label: 'Kanban', icon: KanbanSquare },
  { href: '/taller', label: 'Taller', icon: Wrench },
  { href: '/territorio', label: 'Territorio', icon: MapPin },
  { href: '/actividad', label: 'Actividad', icon: History, adminOnly: true },
  { href: '/usuarios', label: 'Usuarios', icon: Users, adminOnly: true },
  { href: '/auditoria', label: 'Auditoría', icon: ShieldCheck, adminOnly: true },
]

export function AppSidebar({
  apellidoNombre,
  isAdmin,
  profileId,
}: {
  apellidoNombre: string | null
  isAdmin: boolean
  profileId: string | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const { resolvedTheme, setTheme } = useTheme()
  // next-themes no sabe el tema real hasta montar en el cliente -- sin
  // este guard, el ícono parpadearía entre sol/luna al hidratar.
  const [mounted, setMounted] = useState(false)
  // "Nuevo" al lado de Mi perfil hasta que lo clickeen una vez -- así se
  // enteran de que existe sin depender de que alguien se los avise a
  // mano. Arranca en true (oculto) hasta montar para no mostrarlo de
  // más un instante mientras se lee localStorage.
  const [miPerfilVisto, setMiPerfilVisto] = useState(true)
  useEffect(() => {
    setMounted(true)
    try {
      setMiPerfilVisto(localStorage.getItem('mi-perfil-visto') === 'true')
    } catch {
      // Si localStorage no está disponible (modo privado, etc.), no
      // rompe nada -- simplemente no se muestra la etiqueta.
    }
  }, [])

  function handleNavClick() {
    if (isMobile) setOpenMobile(false)
  }

  function handleMiPerfilClick() {
    handleNavClick()
    setMiPerfilVisto(true)
    try {
      localStorage.setItem('mi-perfil-visto', 'true')
    } catch {
      // Sin localStorage, la etiqueta vuelve a aparecer en la próxima
      // visita -- no ideal, pero no bloquea nada.
    }
  }

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
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary">
            <Image
              src="/images/logo-icono-dte.png"
              alt=""
              width={36}
              height={36}
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-bold tracking-tight">
              Registro Técnico
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
              {!isAdmin && profileId && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link href={`/alumnos/${profileId}`} onClick={handleMiPerfilClick} />
                    }
                    isActive={pathname.startsWith(`/alumnos/${profileId}`)}
                    tooltip="Mi perfil"
                  >
                    <UserRound />
                    <span>Mi perfil</span>
                  </SidebarMenuButton>
                  {mounted && !miPerfilVisto && (
                    <SidebarMenuBadge className="bg-primary text-primary-foreground">
                      Nuevo
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )}
              {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} onClick={handleNavClick} />}
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
        <div className="mt-auto flex items-center justify-center px-3 py-4 group-data-[collapsible=icon]:hidden">
          <Image
            src="/images/logo-dte-2026-v3.png"
            alt="Dirección de Tecnología Educativa (DTE)"
            width={994}
            height={605}
            className="h-auto w-44 opacity-90"
          />
        </div>
      </SidebarContent>
      <SidebarFooter className="gap-2 border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {apellidoNombre ?? 'Sin perfil'}
            </span>
            <span className="text-[11px] text-sidebar-foreground/70">
              {isAdmin ? 'FED' : 'Estudiante'}
            </span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              tooltip="Cambiar tema"
            >
              {mounted && resolvedTheme === 'dark' ? <Sun /> : <Moon />}
              <span>{mounted && resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
