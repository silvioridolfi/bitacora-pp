'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { EstadoBadge } from '@/components/estado-badge'
import type { Equipment, TipoOT } from '@/lib/types'

const nativeSelectClass =
  'h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const TIPO_LABEL: Record<TipoOT, string> = {
  taller: 'Taller',
  territorio: 'Territorio',
}

const FECHA_SORT_STORAGE_KEY = 'equipos-fecha-sort'

export function EquiposTable({
  equipment,
  tipoByEquipmentId,
}: {
  equipment: Equipment[]
  tipoByEquipmentId: Record<string, TipoOT>
}) {
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('')
  const [grupo, setGrupo] = useState('')
  const [tipo, setTipo] = useState('')
  // Por defecto, más nuevos primero (coincide con el orden que ya trae del
  // servidor -- así no hay parpadeo al cargar la página). Después de
  // montado, si el usuario había elegido otro orden en una visita
  // anterior, se aplica acá.
  const [fechaSort, setFechaSort] = useState<'asc' | 'desc'>('desc')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(FECHA_SORT_STORAGE_KEY)
    if (stored === 'asc' || stored === 'desc') setFechaSort(stored)
  }, [])

  function toggleFechaSort() {
    setFechaSort((prev) => {
      const next = prev === 'desc' ? 'asc' : 'desc'
      window.localStorage.setItem(FECHA_SORT_STORAGE_KEY, next)
      return next
    })
  }

  function scrollByStep(direction: 1 | -1) {
    const scrollable = containerRef.current?.querySelector('[data-slot="table-container"]')
    scrollable?.scrollBy({ left: direction * 240, behavior: 'smooth' })
  }

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
    const result = equipment.filter((eq) => {
      const matchesQuery =
        !q ||
        eq.numero_serie?.toLowerCase().includes(q) ||
        eq.modelo?.toLowerCase().includes(q) ||
        eq.marca?.toLowerCase().includes(q)
      const matchesEstado = !estado || eq.estado_actual === estado
      const matchesGrupo = !grupo || eq.grupo === grupo
      const matchesTipo = !tipo || tipoByEquipmentId[eq.id] === tipo
      return matchesQuery && matchesEstado && matchesGrupo && matchesTipo
    })

    result.sort((a, b) => {
      // Sin fecha cargada siempre al final, sea cual sea el orden elegido.
      if (!a.fecha_ingreso && !b.fecha_ingreso) return 0
      if (!a.fecha_ingreso) return 1
      if (!b.fecha_ingreso) return -1
      const diff = new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime()
      return fechaSort === 'asc' ? diff : -diff
    })

    return result
  }, [equipment, query, estado, grupo, tipo, tipoByEquipmentId, fechaSort])

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
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={nativeSelectClass}
        >
          <option value="">Todos (taller/territorio)</option>
          <option value="taller">Taller</option>
          <option value="territorio">Territorio</option>
        </select>
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

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {equipment.length} equipos.
        </p>
        <div className="flex gap-1 sm:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => scrollByStep(-1)}
            title="Desplazar hacia la izquierda"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => scrollByStep(1)}
            title="Desplazar hacia la derecha"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° de serie</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Generación</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={toggleFechaSort}
                  className="flex items-center gap-1 hover:text-foreground"
                  title="Ordenar por fecha de ingreso"
                >
                  Ingreso
                  {fechaSort === 'asc' ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                </button>
              </TableHead>
              <TableHead>Estado actual</TableHead>
              <TableHead>Tipo</TableHead>
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
                  <EstadoBadge estado={eq.estado_actual} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tipoByEquipmentId[eq.id] ? TIPO_LABEL[tipoByEquipmentId[eq.id]] : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{eq.grupo ?? '—'}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
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
