import { createClient } from '@/lib/supabase/server'
import { WorkOrderForm } from '@/components/work-order-form'
import { WorkOrderCard } from '@/components/work-order-card'
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Wrench } from 'lucide-react'
import { getCurrentProfile } from '@/lib/data'
import type { Profile, WorkOrder } from '@/lib/types'

export default async function TallerPage() {
  const supabase = await createClient()

  const [{ data: workOrders }, { data: profiles }, { profile }] = await Promise.all([
    supabase
      .from('work_orders')
      .select(
        '*, equipment:equipment_id(*), responsable:responsable_id(*), school:school_id(*), work_order_stages(*, profile:profile_id(*)), work_order_actions(*)',
      )
      .eq('tipo', 'taller')
      .order('fecha', { ascending: false })
      .limit(60),
    supabase.from('profiles').select('*').order('apellido_nombre'),
    getCurrentProfile(),
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((wo) => (
            <WorkOrderForm
              key={wo.id}
              tipo="taller"
              profiles={(profiles ?? []) as Profile[]}
              workOrder={wo}
              trigger={
                <WorkOrderCard
                  workOrder={wo}
                  isAdmin={isAdmin}
                  currentProfileId={currentProfileId}
                />
              }
              isAdmin={isAdmin}
              currentProfileId={currentProfileId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
