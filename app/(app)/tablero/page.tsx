import { createClient } from '@/lib/supabase/server'
import { TableroBoard } from '@/components/tablero-board'
import { getCurrentProfile } from '@/lib/data'
import type { Equipment, Profile, School, WorkOrder } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function TableroPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; grupo?: string }>
}) {
  const { tipo, grupo } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('work_orders')
    .select(
      '*, equipment:equipment_id(*), responsable:responsable_id(*), school:school_id(*), work_order_stages(*, profile:profile_id(*))',
    )
    .order('fecha', { ascending: false })
    .limit(300)

  if (tipo === 'taller' || tipo === 'territorio') {
    query = query.eq('tipo', tipo)
  }
  if (grupo === 'Grupo 1' || grupo === 'Grupo 2') {
    query = query.eq('grupo', grupo)
  }

  const [{ data }, { data: equipment }, { data: profiles }, { data: schools }, { profile }] =
    await Promise.all([
      query,
      supabase.from('equipment').select('*').order('numero_serie'),
      supabase.from('profiles').select('*').order('apellido_nombre'),
      supabase.from('schools').select('*').order('nombre'),
      getCurrentProfile(),
    ])
  const orders = (data ?? []) as unknown as WorkOrder[]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tablero</h1>
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
        equipment={(equipment ?? []) as Equipment[]}
        profiles={(profiles ?? []) as Profile[]}
        schools={(schools ?? []) as School[]}
        isAdmin={profile?.is_admin ?? false}
        currentProfileId={profile?.id ?? null}
      />
    </div>
  )
}
