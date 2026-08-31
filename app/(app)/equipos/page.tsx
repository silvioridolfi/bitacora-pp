import { createClient } from '@/lib/supabase/server'
import { EquiposTable } from '@/components/equipos-table'
import type { Equipment, TipoOT } from '@/lib/types'

export default async function EquiposPage() {
  const supabase = await createClient()
  const [{ data }, { data: workOrders }] = await Promise.all([
    supabase.from('equipment').select('*').order('numero_serie'),
    supabase
      .from('work_orders')
      .select('equipment_id, tipo, created_at')
      .not('equipment_id', 'is', null)
      .order('created_at', { ascending: true }),
  ])
  const equipment = (data ?? []) as Equipment[]

  // Mapa equipo -> tipo de la OT más reciente (en la práctica, cada equipo
  // tiene un único tipo a lo largo de su historia, pero por las dudas nos
  // quedamos con la última si alguna vez llegara a tener de ambos).
  const tipoByEquipmentId = new Map<string, TipoOT>()
  for (const wo of workOrders ?? []) {
    if (wo.equipment_id) tipoByEquipmentId.set(wo.equipment_id, wo.tipo as TipoOT)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Equipos</h1>
        <p className="text-sm text-muted-foreground">
          {equipment.length} equipos registrados. Hacé click en un equipo para ver su
          historial completo.
        </p>
      </div>

      <EquiposTable equipment={equipment} tipoByEquipmentId={Object.fromEntries(tipoByEquipmentId)} />
    </div>
  )
}
