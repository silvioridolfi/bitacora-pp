'use client'

import { useState } from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  ESTADOS_INICIALES_EQUIPO,
  GENERACIONES_NETBOOK,
  MARCAS_NETBOOK,
  PROGRAMAS_NETBOOK,
  PROGRAMA_SERIE_PREFIX,
  TIPOS_EQUIPO,
  TIPO_EQUIPO_LABEL,
} from '@/lib/types'
import type { ProgramaNetbook, TipoEquipo } from '@/lib/types'

const nativeSelectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function EquipoIntakeFields() {
  const [tipoEquipo, setTipoEquipo] = useState<TipoEquipo>('netbook')
  const [programa, setPrograma] = useState<ProgramaNetbook | ''>('')
  const [serieResto, setSerieResto] = useState('')
  const [sinDatos, setSinDatos] = useState(false)

  const prefix = tipoEquipo === 'netbook' && programa ? PROGRAMA_SERIE_PREFIX[programa] : ''
  const numeroSerieCompleto = sinDatos ? '' : prefix + serieResto

  function applyTipoEquipo(next: TipoEquipo) {
    setTipoEquipo(next)
    if (next !== 'netbook') {
      setPrograma('')
      setSerieResto('')
    }
  }

  function applyPrograma(next: ProgramaNetbook | '') {
    setPrograma(next)
    setSerieResto('')
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
      <p className="text-xs font-semibold text-foreground">Equipo (carga manual)</p>

      <Field>
        <FieldLabel htmlFor="tipo_equipo">Tipo de equipamiento</FieldLabel>
        <select
          id="tipo_equipo"
          name="tipo_equipo"
          className={nativeSelectClass}
          value={tipoEquipo}
          onChange={(e) => applyTipoEquipo(e.target.value as TipoEquipo)}
        >
          {TIPOS_EQUIPO.map((t) => (
            <option key={t} value={t}>
              {TIPO_EQUIPO_LABEL[t]}
            </option>
          ))}
        </select>
      </Field>

      {tipoEquipo === 'netbook' && (
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="programa">Programa</FieldLabel>
            <select
              id="programa"
              name="programa"
              className={nativeSelectClass}
              value={programa}
              onChange={(e) => applyPrograma(e.target.value as ProgramaNetbook | '')}
            >
              <option value="">Seleccionar…</option>
              {PROGRAMAS_NETBOOK.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="generacion">Generación</FieldLabel>
            <select id="generacion" name="generacion" className={nativeSelectClass} defaultValue="">
              <option value="">Sin especificar</option>
              {GENERACIONES_NETBOOK.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="equipo_marca">Marca</FieldLabel>
          {tipoEquipo === 'netbook' ? (
            <select id="equipo_marca" name="equipo_marca" className={nativeSelectClass} defaultValue="">
              <option value="">Seleccionar…</option>
              {MARCAS_NETBOOK.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <Input id="equipo_marca" name="equipo_marca" placeholder="Ej. HP, Dell…" />
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="equipo_modelo">Modelo</FieldLabel>
          <Input id="equipo_modelo" name="equipo_modelo" placeholder="Opcional" />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="estado_inicial">Estado inicial (con qué llegó)</FieldLabel>
        <select id="estado_inicial" name="estado_inicial" className={nativeSelectClass} defaultValue="">
          <option value="">Seleccionar…</option>
          {ESTADOS_INICIALES_EQUIPO.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </Field>

      <Field>
        <FieldLabel htmlFor="numero_serie_resto">N° de serie</FieldLabel>
        {prefix ? (
          <div className="flex items-stretch overflow-hidden rounded-lg border border-input">
            <span className="flex items-center bg-muted px-2.5 text-sm font-semibold text-muted-foreground select-none">
              {prefix}
            </span>
            <input
              id="numero_serie_resto"
              value={serieResto}
              onChange={(e) => setSerieResto(e.target.value)}
              disabled={sinDatos}
              placeholder="Resto del N° de serie"
              required={!sinDatos}
              className="h-9 flex-1 border-0 bg-transparent px-2.5 text-sm outline-none disabled:opacity-50"
            />
          </div>
        ) : (
          <Input
            id="numero_serie_resto"
            value={serieResto}
            onChange={(e) => setSerieResto(e.target.value)}
            disabled={sinDatos}
            placeholder="N° de serie"
            required={!sinDatos}
          />
        )}
        <input type="hidden" name="numero_serie" value={numeroSerieCompleto} />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="sin_datos"
            checked={sinDatos}
            onChange={(e) => setSinDatos(e.target.checked)}
          />
          N° de serie ilegible / sin datos (S/D)
        </label>
      </Field>
    </div>
  )
}
