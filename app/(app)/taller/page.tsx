import { createClient } from '@/lib/supabase/server'
import { WorkOrderForm } from '@/components/work-order-form'
import { WorkOrderGrid } from '@/components/work-order-grid'
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Wrench } from 'lucide-react'
import { getCurrentProfile, getTodayRolesByProfile } from '@/lib/data'
import type { Profile, WorkOrder } from '@/lib/types'

export default async function TallerPage() {
  const supabase = await createClient()

  const [{ data: workOrders }, { data: profiles }, { profile }, rolesByProfile] =
    await Promise.all([
      supabase
        .from('work_orders')
        .select(
          '*, equipment:equipment_id(*), responsable:responsable_id(*), responsable_original:responsable_original_id(*), school:school_id(*), work_order_events(*, profile:profile_id(*))',
        )
        .eq('tipo', 'taller')
        .order('fecha', { ascending: false })
        .limit(60),
      supabase.from('profiles').select('*').order('apellido_nombre'),
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Taller</h1>
          <p className="text-sm text-muted-foreground">
            Órdenes de trabajo sobre equipos en el taller.
          </p>
        </div>
        <WorkOrderForm
          tipo="taller"
          profiles={(profiles ?? []) as Profile[]}
          isAdmin={isAdmin}
          currentProfileId={currentProfileId}
        />
      </div>

      {orders.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Wrench />
          </EmptyMedia>
          <EmptyTitle>Sin órdenes de taller</EmptyTitle>
          <EmptyDescription>
            Creá la primera OT de taller con el botón &quot;Nueva OT&quot;.
          </EmptyDescription>
        </Empty>
      ) : (
        <WorkOrderGrid
          orders={orders}
          profiles={(profiles ?? []) as Profile[]}
          isAdmin={isAdmin}
          currentProfileId={currentProfileId}
          rolesByProfile={rolesByProfile}
        />
      )}
    </div>
  )
}
