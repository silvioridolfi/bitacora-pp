import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TableroBoard } from '@/components/tablero-board'
import { WorkOrderGrid } from '@/components/work-order-grid'
import { getCurrentProfile, getTodayRolesByProfile } from '@/lib/data'
import { WORK_ORDER_ESTADOS } from '@/lib/types'
import type { Profile, School, WorkOrder, WorkOrderEstado } from '@/lib/types'
import { cn } from '@/lib/utils'

function parseEstados(estado?: string, estados?: string): WorkOrderEstado[] {
  const raw = estados ? estados.split(',') : estado ? [estado] : []
  return raw.filter((e): e is WorkOrderEstado =>
    (WORK_ORDER_ESTADOS as readonly string[]).includes(e),
  )
}

export default async function TableroPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; grupo?: string; estado?: string; estados?: string }>
}) {
  const { tipo, grupo, estado, estados } = await searchParams
  const estadosFiltro = parseEstados(estado, estados)
  const supabase = await createClient()

  let query = supabase
    .from('work_orders')
    .select(
      '*, equipment:equipment_id(*), responsable:responsable_id(*), responsable_original:responsable_original_id(*), last_edited_by_profile:last_edited_by(*), school:school_id(*), work_order_events(*, profile:profile_id(*))',
    )
    .order('fecha', { ascending: false })
    .limit(300)

  if (tipo === 'taller' || tipo === 'territorio') {
    query = query.eq('tipo', tipo)
  }
  if (grupo === 'Grupo 1' || grupo === 'Grupo 2') {
    query = query.eq('grupo', grupo)
  }
  if (estadosFiltro.length > 0) {
    query = query.in('estado', estadosFiltro)
  }

  const [{ data }, { data: profiles }, { data: schools }, { profile }, rolesByProfile] =
    await Promise.all([
      query,
      supabase.from('profiles').select('*').order('apellido_nombre'),
      supabase.from('schools').select('*').order('nombre'),
      getCurrentProfile(),
      getTodayRolesByProfile(),
    ])
  const orders = (data ?? []) as unknown as WorkOrder[]
  const isAdmin = profile?.is_admin ?? false
  const currentProfileId = profile?.id ?? null

  // Con un filtro de estado puntual, mostramos directamente el listado
  // de esas OT (con buscador) en vez del kanban completo con columnas.
  if (estadosFiltro.length > 0) {
    const titulo =
      estadosFiltro.length === 1 ? estadosFiltro[0] : `${estadosFiltro.length} estados`

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{titulo}</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} OT en {estadosFiltro.length === 1 ? 'este estado' : 'estos estados'}.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
            <Link
              href="/tablero"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Ver kanban completo
            </Link>
          </div>
        </div>

        <WorkOrderGrid
          orders={orders}
          profiles={(profiles ?? []) as Profile[]}
          schools={(schools ?? []) as School[]}
          isAdmin={isAdmin}
          currentProfileId={currentProfileId}
          rolesByProfile={rolesByProfile}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Vista kanban de todas las órdenes de trabajo por estado.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {[
            { label: 'Todos', value: '' },
            { label: 'Taller', value: 'taller' },
            { label: 'Territorio', value: 'territorio' },
          ].map((opt) => (
            <a
              key={opt.value}
              href={opt.value ? `/tablero?tipo=${opt.value}` : '/tablero'}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                (tipo ?? '') === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>

      <TableroBoard
        orders={orders}
        profiles={(profiles ?? []) as Profile[]}
        schools={(schools ?? []) as School[]}
        isAdmin={isAdmin}
        currentProfileId={currentProfileId}
        rolesByProfile={rolesByProfile}
      />
    </div>
  )
}
