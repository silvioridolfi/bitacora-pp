import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data'
import { ActivityFeed } from '@/components/activity-feed'

export default async function ActividadPage() {
  const { profile } = await getCurrentProfile()
  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('work_order_events')
    .select(
      '*, profile:profile_id(*), work_order:work_order_id(codigo, tipo, grupo, equipment:equipment_id(numero_serie))',
    )
    .order('completed_at', { ascending: false })
    .limit(300)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Actividad</h1>
        <p className="text-sm text-muted-foreground">
          Registro cronológico de quién completó cada paso, en qué OT y cuándo -- últimos 300
          eventos.
        </p>
      </div>
      <ActivityFeed events={data ?? []} />
    </div>
  )
}
