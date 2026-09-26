'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { SearchInput } from '@/components/search-input'
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
import { cn, nativeSelectClass } from '@/lib/utils'

const TIPO_LABEL: Record<TipoOT, string> = {
  taller: 'Taller',
  territorio: 'Territorio',
}

const FECHA_SORT_STORAGE_KEY = 'equipos-fecha-sort'

export function EquiposTable({
  equipment,
  tipoByEquipmentId,
  otCodigoByEquipmentId,
  ottCodigoByEquipmentId,
}: {
  equipment: Equipment[]
  tipoByEquipmentId: Record<string, TipoOT>
  otCodigoByEquipmentId: Record<string, string>
  ottCodigoByEquipmentId: Record<string, string>
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
        eq.marca?.toLowerCase().includes(q) ||
        otCodigoByEquipmentId[eq.id]?.toLowerCase().includes(q) ||
        ottCodigoByEquipmentId[eq.id]?.toLowerCase().includes(q)
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
  }, [
    equipment,
    query,
    estado,
    grupo,
    tipo,
    tipoByEquipmentId,
    otCodigoByEquipmentId,
    ottCodigoByEquipmentId,
    fechaSort,
  ])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por N° de serie, marca, modelo o código de OT…"
          className="min-w-[220px] flex-1"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={cn(nativeSelectClass, 'w-auto')}
        >
          <option value="">Todos (taller/territorio)</option>
          <option value="taller">Taller</option>
          <option value="territorio">Territorio</option>
        </select>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className={cn(nativeSelectClass, 'w-auto')}
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
          className={cn(nativeSelectClass, 'w-auto')}
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

      {/* Mobile: cards en vez de una tabla de 7 columnas con scroll
          horizontal -- mucho más cómodo de leer en el celu. */}
      <div className="flex flex-col gap-2 sm:hidden">
        {filtered.map((eq) => (
          <Link
            key={eq.id}
            href={`/equipos/${eq.id}`}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-primary">{eq.numero_serie}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[eq.marca, eq.modelo].filter(Boolean).join(' ') || 'Sin marca/modelo'}
                  {eq.generacion ? ` · ${eq.generacion}` : ''}
                </p>
              </div>
              <EstadoBadge estado={eq.estado_actual} className="shrink-0" />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>
                {tipoByEquipmentId[eq.id] ? TIPO_LABEL[tipoByEquipmentId[eq.id]] : 'Sin tipo'}
              </span>
              {eq.grupo && <span>{eq.grupo}</span>}
              <span>{formatDate(eq.fecha_ingreso)}</span>
              {(otCodigoByEquipmentId[eq.id] || ottCodigoByEquipmentId[eq.id]) && (
                <span>
                  {[otCodigoByEquipmentId[eq.id], ottCodigoByEquipmentId[eq.id]]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Ningún equipo coincide con los filtros.
          </p>
        )}
      </div>

      <div className="hidden rounded-xl border border-border bg-card sm:block">
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
              <TableHead>OT</TableHead>
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
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {[otCodigoByEquipmentId[eq.id], ottCodigoByEquipmentId[eq.id]]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tipoByEquipmentId[eq.id] ? TIPO_LABEL[tipoByEquipmentId[eq.id]] : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{eq.grupo ?? '—'}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
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
