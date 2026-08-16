import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/format'
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

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° de serie</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Generación</TableHead>
              <TableHead>Ingreso</TableHead>
              <TableHead>Estado actual</TableHead>
              <TableHead>Grupo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((eq) => (
              <TableRow key={eq.id}>
                <TableCell>
                  <Link
                    href={`/equipos/${eq.id}`}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {eq.numero_serie}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {eq.marca} {eq.modelo}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {eq.generacion ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(eq.fecha_ingreso)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{eq.estado_actual ?? '—'}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {eq.grupo ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
