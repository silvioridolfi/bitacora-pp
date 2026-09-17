'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { updateEquipment } from '@/lib/actions'
import {
  ESTADOS_INICIALES_EQUIPO,
  GENERACIONES_NETBOOK,
  MARCAS_NETBOOK,
  PROGRAMAS_NETBOOK,
  TIPOS_EQUIPO,
  TIPO_EQUIPO_LABEL,
} from '@/lib/types'
import type { Equipment, ProgramaNetbook, TipoEquipo } from '@/lib/types'
import { nativeSelectClass } from '@/lib/utils'

/**
 * Edición de los datos de identificación de un equipo ya cargado --
 * solo admin. Para corregir errores de tipeo (número de serie sobre
 * todo) sin necesitar borrar el equipo entero y perder su historial
 * de OT.
 */
export function EditEquipmentButton({
  equipment,
  compact = false,
}: {
  equipment: Equipment
  /** Solo ícono + "Editar", para usar junto a otro label (ej. dentro
   * del modal de la OT, donde "Editar equipo" sería redundante). */
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [tipoEquipo, setTipoEquipo] = useState<TipoEquipo>(equipment.tipo_equipo)
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateEquipment(equipment.id, formData)
      if (result.ok) {
        toast.success('Equipo actualizado.')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className={compact ? 'h-7 text-xs' : ''}>
            <Pencil className="size-4" data-icon="inline-start" />
            {compact ? 'Editar' : 'Editar equipo'}
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Editar equipo</DialogTitle>
          <DialogDescription>
            Corrige el N° de serie u otros datos de identificación. No afecta el historial de OT
            de este equipo.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="edit_tipo_equipo">Tipo de equipamiento</FieldLabel>
            <select
              id="edit_tipo_equipo"
              name="tipo_equipo"
              className={nativeSelectClass}
              value={tipoEquipo}
              onChange={(e) => setTipoEquipo(e.target.value as TipoEquipo)}
            >
              {TIPOS_EQUIPO.map((t) => (
                <option key={t} value={t}>
                  {TIPO_EQUIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>

          {tipoEquipo === 'netbook' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field className="min-w-0">
                <FieldLabel htmlFor="edit_programa">Programa</FieldLabel>
                <select
                  id="edit_programa"
                  name="programa"
                  className={nativeSelectClass}
                  defaultValue={equipment.programa ?? ''}
                >
                  <option value="">Sin especificar</option>
                  {PROGRAMAS_NETBOOK.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field className="min-w-0">
                <FieldLabel htmlFor="edit_generacion">Generación</FieldLabel>
                <select
                  id="edit_generacion"
                  name="generacion"
                  className={nativeSelectClass}
                  defaultValue={equipment.generacion ?? ''}
                >
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field className="min-w-0">
              <FieldLabel htmlFor="edit_equipo_marca">Marca</FieldLabel>
              {tipoEquipo === 'netbook' ? (
                <select
                  id="edit_equipo_marca"
                  name="equipo_marca"
                  className={nativeSelectClass}
                  defaultValue={equipment.marca ?? ''}
                >
                  <option value="">Seleccionar…</option>
                  {MARCAS_NETBOOK.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="edit_equipo_marca"
                  name="equipo_marca"
                  defaultValue={equipment.marca ?? ''}
                  placeholder="Ej. HP, Dell…"
                />
              )}
            </Field>
            <Field className="min-w-0">
              <FieldLabel htmlFor="edit_equipo_modelo">Modelo</FieldLabel>
              <Input
                id="edit_equipo_modelo"
                name="equipo_modelo"
                defaultValue={equipment.modelo ?? ''}
                placeholder="Opcional"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="edit_estado_inicial">Estado inicial (con qué llegó)</FieldLabel>
            <select
              id="edit_estado_inicial"
              name="estado_inicial"
              className={nativeSelectClass}
              defaultValue={equipment.estado_inicial ?? ''}
            >
              <option value="">Seleccionar…</option>
              {ESTADOS_INICIALES_EQUIPO.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit_numero_serie">N° de serie</FieldLabel>
            <Input
              id="edit_numero_serie"
              name="numero_serie"
              defaultValue={equipment.numero_serie}
              required
            />
          </Field>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
