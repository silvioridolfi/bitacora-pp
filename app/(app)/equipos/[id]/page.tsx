import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WorkOrderCard } from '@/components/work-order-card'
import { WorkOrderForm } from '@/components/work-order-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate } from '@/lib/format'
import { getCurrentProfile } from '@/lib/data'
import type { Equipment, Profile, School, WorkOrder } from '@/lib/types'

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: equipment }, { data: workOrders }, { profile }, { data: profiles }, { data: schools }] =
    await Promise.all([
      supabase.from('equipment').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('work_orders')
        .select(
          '*, equipment:equipment_id(*), responsable:responsable_id(*), responsable_original:responsable_original_id(*), school:school_id(*), work_order_events(*, profile:profile_id(*))',
        )
        .eq('equipment_id', id)
        .order('fecha', { ascending: true }),
      getCurrentProfile(),
      supabase.from('profiles').select('*').order('apellido_nombre'),
      supabase.from('schools').select('*').order('nombre'),
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
            <Badge variant="secondary" className="text-sm" title="Se calcula solo, según la OT más reciente de este equipo">
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
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                Formato de software
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="size-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Indica si el equipo tiene instalado y verificado el sistema operativo /
                    imagen de software correspondiente al programa. &quot;Con
                    observación&quot; significa que hubo un problema con esa instalación.
                  </TooltipContent>
                </Tooltip>
              </p>
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
              <WorkOrderForm
                key={wo.id}
                tipo={wo.tipo}
                profiles={(profiles ?? []) as Profile[]}
                schools={(schools ?? []) as School[]}
                workOrder={wo}
                trigger={
                  <WorkOrderCard
                    workOrder={wo}
                    isAdmin={profile?.is_admin ?? false}
                    currentProfileId={profile?.id ?? null}
                  />
                }
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
