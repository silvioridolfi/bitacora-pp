import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data'
import { WorkOrderCard } from '@/components/work-order-card'
import { WorkOrderForm } from '@/components/work-order-form'
import type { Profile, School, WorkOrder, WorkOrderEvent } from '@/lib/types'

export default async function AlumnoOrdenesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ estado?: string }>
}) {
  const { id } = await params
  const { estado: estadoFiltro } = await searchParams
  const supabase = await createClient()
  const { profile: currentProfile } = await getCurrentProfile()

  if (!currentProfile) redirect('/auth/login')
  if (!currentProfile.is_admin && currentProfile.id !== id) {
    redirect(`/alumnos/${currentProfile.id}`)
  }

  const { data: studentData } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  const student = studentData as Profile | null
  if (!student) notFound()
  if (student.is_admin) redirect('/usuarios')

  const { data: eventsData } = await supabase
    .from('work_order_events')
    .select('work_order_id, profile_id')
    .eq('profile_id', id)
  const workOrderIds = [
    ...new Set(((eventsData ?? []) as Pick<WorkOrderEvent, 'work_order_id' | 'profile_id'>[]).map(
      (e) => e.work_order_id,
    )),
  ]

  const [{ data: ordersData }, { data: profiles }, { data: schools }] = await Promise.all([
    workOrderIds.length > 0
      ? supabase
          .from('work_orders')
          .select(
            '*, equipment:equipment_id(*), responsable:responsable_id(*), responsable_original:responsable_original_id(*), last_edited_by_profile:last_edited_by(*), session:session_id(*), school:school_id(*), work_order_events(*, profile:profile_id(*))',
          )
          .in('id', workOrderIds)
          .order('fecha', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('profiles').select('*').order('apellido_nombre'),
    supabase.from('schools').select('*').order('nombre'),
  ])

  const allOrders = (ordersData ?? []) as unknown as WorkOrder[]
  const orders = estadoFiltro ? allOrders.filter((o) => o.estado === estadoFiltro) : allOrders

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/alumnos/${id}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al perfil
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          OTs de {student.apellido_nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          {estadoFiltro ? (
            <>
              {orders.length} en estado &quot;{estadoFiltro}&quot; ·{' '}
              <Link href={`/alumnos/${id}/ordenes`} className="text-primary hover:underline">
                ver todas ({allOrders.length})
              </Link>
            </>
          ) : (
            `${allOrders.length} en total`
          )}
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {estadoFiltro
            ? `No hay OT en estado "${estadoFiltro}".`
            : 'Todavía no completó ningún paso en una OT.'}
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
                  isAdmin={currentProfile.is_admin}
                  currentProfileId={currentProfile.id}
                />
              }
              isAdmin={currentProfile.is_admin}
              currentProfileId={currentProfile.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
