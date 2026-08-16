'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createWorkOrder, updateWorkOrder } from '@/lib/actions'
import { WORK_ORDER_ESTADOS } from '@/lib/types'
import type { Equipment, Profile, School, TipoOT, WorkOrder } from '@/lib/types'

const nativeSelectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function WorkOrderForm({
  tipo,
  equipment,
  profiles,
  schools,
  workOrder,
  trigger,
}: {
  tipo: TipoOT
  equipment: Equipment[]
  profiles: Profile[]
  schools?: School[]
  workOrder?: WorkOrder
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [grupo, setGrupo] = useState(workOrder?.grupo ?? '')
  const [estado, setEstado] = useState(workOrder?.estado ?? 'Pendiente')
  const router = useRouter()

  const responsables = useMemo(() => {
    if (!grupo) return profiles.filter((p) => p.is_admin)
    return profiles.filter((p) => p.grupo === grupo || p.is_admin)
  }, [grupo, profiles])

  const showTrabajoRealizado = estado === 'Finalizada OK' || estado === 'Derivada'

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = workOrder
        ? await updateWorkOrder(workOrder.id, formData)
        : await createWorkOrder(formData)

      if (result.ok) {
        toast.success(workOrder ? 'OT actualizada' : 'OT creada correctamente')
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
          trigger ?? (
            <Button>
              <PlusIcon data-icon="inline-start" />
              Nueva OT
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {workOrder ? `Editar ${workOrder.codigo}` : `Nueva OT de ${tipo}`}
          </DialogTitle>
          <DialogDescription>
            {tipo === 'taller'
              ? 'Registrá una intervención sobre un equipo en el taller.'
              : 'Registrá una intervención en territorio (escuela).'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <input type="hidden" name="tipo" value={tipo} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="equipment_id">Equipo (N° de serie)</FieldLabel>
              <select
                id="equipment_id"
                name="equipment_id"
                defaultValue={workOrder?.equipment_id ?? ''}
                className={nativeSelectClass}
                required
              >
                <option value="">Seleccionar equipo…</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.numero_serie} {eq.modelo ? `— ${eq.modelo}` : ''}
                  </option>
                ))}
              </select>
            </Field>

            {tipo === 'territorio' && (
              <Field>
                <FieldLabel htmlFor="school_id">Escuela</FieldLabel>
                <select
                  id="school_id"
                  name="school_id"
                  defaultValue={workOrder?.school_id ?? ''}
                  className={nativeSelectClass}
                  required
                >
                  <option value="">Seleccionar escuela…</option>
                  {(schools ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.cue ? `(CUE ${s.cue})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  defaultValue={workOrder?.fecha ?? new Date().toISOString().slice(0, 10)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="grupo">Grupo</FieldLabel>
                <select
                  id="grupo"
                  name="grupo"
                  className={nativeSelectClass}
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                >
                  <option value="">Sin grupo</option>
                  <option value="Grupo 1">Grupo 1</option>
                  <option value="Grupo 2">Grupo 2</option>
                </select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="responsable_id">Responsable</FieldLabel>
              <select
                id="responsable_id"
                name="responsable_id"
                defaultValue={workOrder?.responsable_id ?? ''}
                className={nativeSelectClass}
              >
                <option value="">Sin asignar</option>
                {responsables.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.apellido_nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="estado">Estado</FieldLabel>
              <select
                id="estado"
                name="estado"
                className={nativeSelectClass}
                value={estado}
                onChange={(e) => setEstado(e.target.value as typeof estado)}
              >
                {WORK_ORDER_ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="diagnostico">Diagnóstico</FieldLabel>
              <Textarea
                id="diagnostico"
                name="diagnostico"
                defaultValue={workOrder?.diagnostico ?? ''}
                rows={2}
              />
            </Field>

            {showTrabajoRealizado && (
              <Field>
                <FieldLabel htmlFor="trabajo_realizado">Trabajo realizado</FieldLabel>
                <Textarea
                  id="trabajo_realizado"
                  name="trabajo_realizado"
                  defaultValue={workOrder?.trabajo_realizado ?? ''}
                  rows={2}
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="horas_estimadas">Horas estimadas</FieldLabel>
                <Input
                  id="horas_estimadas"
                  name="horas_estimadas"
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={workOrder?.horas_estimadas ?? ''}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="horas_reales">Horas reales</FieldLabel>
                <Input
                  id="horas_reales"
                  name="horas_reales"
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={workOrder?.horas_reales ?? ''}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="observaciones">Observaciones</FieldLabel>
              <Textarea
                id="observaciones"
                name="observaciones"
                defaultValue={workOrder?.observaciones ?? ''}
                rows={2}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : workOrder ? 'Guardar cambios' : 'Crear OT'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
