import { createClient } from '@/lib/supabase/server'
import { EquiposTable } from '@/components/equipos-table'
import type { Equipment, TipoOT } from '@/lib/types'

export default async function EquiposPage() {
  const supabase = await createClient()
  const [{ data }, { data: workOrders }] = await Promise.all([
    supabase
      .from('equipment')
      .select('*')
      .order('fecha_ingreso', { ascending: false, nullsFirst: false }),
    supabase
      .from('work_orders')
      .select('equipment_id, tipo, codigo, created_at')
      .not('equipment_id', 'is', null)
      .order('created_at', { ascending: true }),
  ])
  const equipment = (data ?? []) as Equipment[]

  // Mapa equipo -> tipo de la OT más reciente (en la práctica, cada equipo
  // tiene un único tipo a lo largo de su historia, pero por las dudas nos
  // quedamos con la última si alguna vez llegara a tener de ambos).
  const tipoByEquipmentId = new Map<string, TipoOT>()
  // Mapa equipo -> código de OT de Taller y de Territorio más recientes de
  // cada tipo (un equipo puede tener ambas a lo largo de su historia).
  const otCodigoByEquipmentId = new Map<string, string>()
  const ottCodigoByEquipmentId = new Map<string, string>()
  for (const wo of workOrders ?? []) {
    if (!wo.equipment_id) continue
    tipoByEquipmentId.set(wo.equipment_id, wo.tipo as TipoOT)
    if (wo.tipo === 'taller') otCodigoByEquipmentId.set(wo.equipment_id, wo.codigo)
    if (wo.tipo === 'territorio') ottCodigoByEquipmentId.set(wo.equipment_id, wo.codigo)
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

      <EquiposTable
        equipment={equipment}
        tipoByEquipmentId={Object.fromEntries(tipoByEquipmentId)}
        otCodigoByEquipmentId={Object.fromEntries(otCodigoByEquipmentId)}
        ottCodigoByEquipmentId={Object.fromEntries(ottCodigoByEquipmentId)}
      />
    </div>
  )
}
