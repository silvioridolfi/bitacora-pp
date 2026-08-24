import { createClient } from '@/lib/supabase/server'
import { WorkOrderForm } from '@/components/work-order-form'
import { WorkOrderGrid } from '@/components/work-order-grid'
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { MapPin } from 'lucide-react'
import { getCurrentProfile, getTodayRolesByProfile } from '@/lib/data'
import type { Profile, School, WorkOrder } from '@/lib/types'

export default async function TerritorioPage() {
  const supabase = await createClient()

  const [{ data: workOrders }, { data: profiles }, { data: schools }, { profile }, rolesByProfile] =
    await Promise.all([
      supabase
        .from('work_orders')
        .select(
          '*, equipment:equipment_id(*), responsable:responsable_id(*), school:school_id(*), work_order_events(*, profile:profile_id(*))',
        )
        .eq('tipo', 'territorio')
        .order('fecha', { ascending: false })
        .limit(60),
      supabase.from('profiles').select('*').order('apellido_nombre'),
      supabase.from('schools').select('*').order('nombre'),
      getCurrentProfile(),
      getTodayRolesByProfile(),
    ])

  const orders = (workOrders ?? []) as unknown as WorkOrder[]
  const isAdmin = profile?.is_admin ?? false
  const currentProfileId = profile?.id ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Territorio</h1>
          <p className="text-sm text-muted-foreground">
            Órdenes de trabajo en escuelas de la Región 1.
          </p>
        </div>
        <WorkOrderForm
          tipo="territorio"
          profiles={(profiles ?? []) as Profile[]}
          schools={(schools ?? []) as School[]}
          isAdmin={isAdmin}
          currentProfileId={currentProfileId}
        />
      </div>

      {orders.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <MapPin />
          </EmptyMedia>
          <EmptyTitle>Sin órdenes de territorio</EmptyTitle>
          <EmptyDescription>
            Creá la primera OT de territorio con el botón &quot;Nueva OT&quot;.
          </EmptyDescription>
        </Empty>
      ) : (
        <WorkOrderGrid
          tipo="territorio"
          orders={orders}
          profiles={(profiles ?? []) as Profile[]}
          schools={(schools ?? []) as School[]}
          isAdmin={isAdmin}
          currentProfileId={currentProfileId}
          rolesByProfile={rolesByProfile}
        />
      )}
    </div>
  )
}
