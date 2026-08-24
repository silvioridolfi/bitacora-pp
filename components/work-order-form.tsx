'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, Trash2 } from 'lucide-react'
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
import { formatDate, formatHoraArgentina } from '@/lib/format'
import { createWorkOrder, updateWorkOrder, deleteWorkOrder } from '@/lib/actions'
import { WORK_ORDER_ESTADOS } from '@/lib/types'
import type { Profile, School, TipoOT, WorkOrder } from '@/lib/types'
import { WorkOrderTimeline } from '@/components/work-order-timeline'
import { EquipoIntakeFields } from '@/components/equipo-intake-fields'
import { SchoolCombobox } from '@/components/school-combobox'
import { todayInArgentina, hasReliableCreatedAt } from '@/lib/timezone'

const nativeSelectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function WorkOrderForm({
  tipo,
  profiles,
  schools,
  workOrder,
  trigger,
  isAdmin = false,
  currentProfileId = null,
}: {
  tipo: TipoOT
  profiles: Profile[]
  schools?: School[]
  workOrder?: WorkOrder
  trigger?: React.ReactElement
  isAdmin?: boolean
  currentProfileId?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [grupo, setGrupo] = useState(workOrder?.grupo ?? '')
  const [estado, setEstado] = useState(workOrder?.estado ?? 'Pendiente')
  const router = useRouter()

  useEffect(() => {
    if (workOrder?.estado) setEstado(workOrder.estado)
  }, [workOrder?.estado])

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

  function handleDelete() {
    if (!workOrder) return
    if (!confirm(`¿Borrar la OT ${workOrder.codigo}? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const result = await deleteWorkOrder(workOrder.id)
      if (result.ok) {
        toast.success('OT borrada')
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
            {workOrder
              ? hasReliableCreatedAt(workOrder.created_at)
                ? `Creada el ${formatDate(workOrder.fecha)} a las ${formatHoraArgentina(workOrder.created_at)}.`
                : `Creada el ${formatDate(workOrder.fecha)}.`
              : tipo === 'taller'
                ? 'Registrá una intervención sobre un equipo en el taller.'
                : 'Registrá una intervención en territorio (escuela).'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <input type="hidden" name="tipo" value={tipo} />
          <FieldGroup>
            {workOrder ? (
              <Field>
                <FieldLabel>Equipo</FieldLabel>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">
                    {workOrder.equipment?.numero_serie ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[workOrder.equipment?.marca, workOrder.equipment?.modelo]
                      .filter(Boolean)
                      .join(' ') || 'Sin marca/modelo'}
                    {workOrder.equipment?.generacion ? ` · ${workOrder.equipment.generacion}` : ''}
                  </p>
                </div>
              </Field>
            ) : (
              <EquipoIntakeFields />
            )}

            {tipo === 'territorio' && (
              <Field>
                <FieldLabel>Escuela</FieldLabel>
                <SchoolCombobox
                  schools={schools ?? []}
                  defaultSchool={workOrder?.school ?? null}
                />
              </Field>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  defaultValue={workOrder?.fecha ?? todayInArgentina()}
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

            {tipo === 'taller' && workOrder ? (
              <Field>
                <FieldLabel>Estado ({workOrder.estado})</FieldLabel>
                <WorkOrderTimeline
                  workOrderId={workOrder.id}
                  events={workOrder.work_order_events ?? []}
                  profiles={
                    workOrder.grupo
                      ? profiles.filter((p) => p.grupo === workOrder.grupo || p.is_admin)
                      : profiles
                  }
                  isAdmin={isAdmin}
                  currentProfileId={currentProfileId}
                  saltarDesbloqueo={workOrder.equipment?.estado_inicial === 'Enciende sin bloqueo'}
                />
                <p className="text-[11px] text-muted-foreground">
                  El estado avanza solo a medida que se completan los pasos del pipeline. Para
                  casos que no siguen el flujo normal (ej. derivar el equipo), usá el selector
                  manual.
                </p>
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
            ) : (
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
            )}

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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="horas_estimadas">Minutos estimados</FieldLabel>
                <Input
                  id="horas_estimadas"
                  name="horas_estimadas"
                  type="number"
                  step="5"
                  min="0"
                  defaultValue={workOrder?.horas_estimadas ?? ''}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="horas_reales">Minutos reales</FieldLabel>
                <Input
                  id="horas_reales"
                  name="horas_reales"
                  type="number"
                  step="5"
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
            {workOrder && isAdmin && (
              <Button
                type="button"
                variant="outline"
                className="mr-auto text-destructive hover:text-destructive"
                disabled={pending}
                onClick={handleDelete}
              >
                <Trash2 data-icon="inline-start" />
                Borrar OT
              </Button>
            )}
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
