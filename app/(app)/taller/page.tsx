import { createClient } from '@/lib/supabase/server'
import { WorkOrderForm } from '@/components/work-order-form'
import { WorkOrderCard } from '@/components/work-order-card'
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Wrench } from 'lucide-react'
import type { Equipment, Profile, WorkOrder } from '@/lib/types'

export default async function TallerPage() {
  const supabase = await createClient()

  const [{ data: workOrders }, { data: equipment }, { data: profiles }] =
    await Promise.all([
      supabase
        .from('work_orders')
        .select(
          '*, equipment:equipment_id(*), responsable:responsable_id(*), school:school_id(*)',
        )
        .eq('tipo', 'taller')
        .order('fecha', { ascending: false })
        .limit(60),
      supabase.from('equipment').select('*').order('numero_serie'),
      supabase.from('profiles').select('*').order('apellido_nombre'),
    ])

  const orders = (workOrders ?? []) as unknown as WorkOrder[]

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
          equipment={(equipment ?? []) as Equipment[]}
          profiles={(profiles ?? []) as Profile[]}
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
              equipment={(equipment ?? []) as Equipment[]}
              profiles={(profiles ?? []) as Profile[]}
              workOrder={wo}
              trigger={<WorkOrderCard workOrder={wo} />}
            />
          ))}
        </div>
      )}
    </div>
  )
}
