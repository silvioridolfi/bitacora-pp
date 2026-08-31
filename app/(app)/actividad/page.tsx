import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data'
import { ActivityFeed } from '@/components/activity-feed'
import { LoginActivityFeed } from '@/components/login-activity-feed'
import { ForceLogoutButton } from '@/components/force-logout-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ActividadPage() {
  const { profile } = await getCurrentProfile()
  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const [{ data: workOrderEvents }, { data: loginEvents }] = await Promise.all([
    supabase
      .from('work_order_events')
      .select(
        '*, profile:profile_id(*), work_order:work_order_id(codigo, tipo, grupo, equipment:equipment_id(numero_serie))',
      )
      .order('completed_at', { ascending: false })
      .limit(300),
    supabase
      .from('login_events')
      .select('*, profile:profile_id(*)')
      .order('logged_in_at', { ascending: false })
      .limit(300),
  ])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Actividad</h1>
        <p className="text-sm text-muted-foreground">
          Registro cronológico de la actividad en el sistema -- últimos 300 eventos por tipo.
        </p>
      </div>
      <Tabs defaultValue="ots">
        <TabsList>
          <TabsTrigger value="ots">Órdenes de trabajo</TabsTrigger>
          <TabsTrigger value="logins">Inicios de sesión</TabsTrigger>
        </TabsList>
        <TabsContent value="ots">
          <ActivityFeed events={workOrderEvents ?? []} />
        </TabsContent>
        <TabsContent value="logins">
          <div className="mb-3 flex justify-end">
            <ForceLogoutButton />
          </div>
          <LoginActivityFeed events={loginEvents ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
