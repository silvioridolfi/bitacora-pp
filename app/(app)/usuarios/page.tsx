import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/data'
import { UsersTable } from '@/components/users-table'
import type { Profile } from '@/lib/types'

export default async function UsuariosPage() {
  const { profile } = await getCurrentProfile()
  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('apellido_nombre')

  // El email vive en auth.users, no en profiles -- se necesita el
  // admin client para listarlo (RLS normal no da acceso a esa tabla).
  let emailById: Record<string, string> = {}
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
    emailById = Object.fromEntries((data?.users ?? []).map((u) => [u.id, u.email ?? '']))
  } catch {
    // Si falta la Service Role Key, se muestra el listado igual, sin
    // emails ni la acción de resetear contraseña.
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Alumnos y FED con acceso al sistema. Podés resetear la contraseña de cualquiera
          sin depender de que reciba el mail.
        </p>
      </div>
      <UsersTable profiles={(profiles ?? []) as Profile[]} emailById={emailById} />
    </div>
  )
}
