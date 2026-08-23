'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

const nativeSelectClass =
  'h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function EquiposTable({ equipment }: { equipment: Equipment[] }) {
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('')
  const [grupo, setGrupo] = useState('')

  const estados = useMemo(
    () =>
      Array.from(new Set(equipment.map((e) => e.estado_actual).filter(Boolean))) as string[],
    [equipment],
  )
  const grupos = useMemo(
    () => Array.from(new Set(equipment.map((e) => e.grupo).filter(Boolean))) as string[],
    [equipment],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return equipment.filter((eq) => {
      const matchesQuery =
        !q ||
        eq.numero_serie?.toLowerCase().includes(q) ||
        eq.modelo?.toLowerCase().includes(q) ||
        eq.marca?.toLowerCase().includes(q)
      const matchesEstado = !estado || eq.estado_actual === estado
      const matchesGrupo = !grupo || eq.grupo === grupo
      return matchesQuery && matchesEstado && matchesGrupo
    })
  }, [equipment, query, estado, grupo])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por N° de serie, marca o modelo…"
            className="pl-8"
          />
        </div>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className={nativeSelectClass}
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
          className={nativeSelectClass}
        >
          <option value="">Todos los grupos</option>
          {grupos.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {equipment.length} equipos.
      </p>

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
            {filtered.map((eq) => (
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
                <TableCell className="text-muted-foreground">{eq.grupo ?? '—'}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Ningún equipo coincide con los filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
