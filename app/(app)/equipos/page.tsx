import { createClient } from '@/lib/supabase/server'
import { EquiposTable } from '@/components/equipos-table'
import type { Equipment } from '@/lib/types'

export default async function EquiposPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('equipment').select('*').order('numero_serie')
  const equipment = (data ?? []) as Equipment[]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Equipos</h1>
        <p className="text-sm text-muted-foreground">
          {equipment.length} equipos registrados. Hacé click en un equipo para ver su
          historial completo.
        </p>
      </div>

      <EquiposTable equipment={equipment} />
    </div>
  )
}
