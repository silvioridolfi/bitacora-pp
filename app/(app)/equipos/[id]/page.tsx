import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WorkOrderCard } from '@/components/work-order-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { getCurrentProfile } from '@/lib/data'
import type { Equipment, WorkOrder } from '@/lib/types'

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: equipment }, { data: workOrders }, { profile }] = await Promise.all([
    supabase.from('equipment').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('work_orders')
      .select(
        '*, equipment:equipment_id(*), responsable:responsable_id(*), school:school_id(*), work_order_stages(*, profile:profile_id(*))',
      )
      .eq('equipment_id', id)
      .order('fecha', { ascending: true }),
    getCurrentProfile(),
  ])

  if (!equipment) notFound()

  const eq = equipment as Equipment
  const orders = (workOrders ?? []) as unknown as WorkOrder[]

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/equipos"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a equipos
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {eq.numero_serie}
              </h1>
              <p className="text-sm text-muted-foreground">
                {eq.marca} {eq.modelo} {eq.generacion ? `· ${eq.generacion}` : ''}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {eq.estado_actual ?? 'Sin estado'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Ingreso</p>
              <p className="text-sm font-medium">{formatDate(eq.fecha_ingreso)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado inicial</p>
              <p className="text-sm font-medium">{eq.estado_inicial ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grupo</p>
              <p className="text-sm font-medium">{eq.grupo ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Formato</p>
              <p className="text-sm font-medium">
                {eq.formato_ok === null ? '—' : eq.formato_ok ? 'OK' : 'Con observación'}
              </p>
            </div>
          </div>

          {eq.observaciones_tecnicas && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Observaciones técnicas</p>
              <p className="text-sm">{eq.observaciones_tecnicas}</p>
            </div>
          )}

          {eq.historial_legado && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Historial migrado</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {eq.historial_legado}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-heading text-lg font-bold text-foreground">
          Historial de órdenes de trabajo ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este equipo todavía no tiene órdenes de trabajo registradas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((wo) => (
              <WorkOrderCard
                key={wo.id}
                workOrder={wo}
                isAdmin={profile?.is_admin ?? false}
                currentProfileId={profile?.id ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
