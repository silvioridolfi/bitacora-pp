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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatHoraArgentina } from '@/lib/format'
import { createWorkOrder, updateWorkOrder, deleteWorkOrder, changeWorkOrderTipo } from '@/lib/actions'
import { EditEquipmentButton } from '@/components/edit-equipment-button'
import { WORK_ORDER_ESTADOS, motivoSinDesbloqueo } from '@/lib/types'
import { WORK_ORDER_STATUS_STYLE } from '@/lib/status'
import type { DailyRoleName, Profile, School, TipoOT, WorkOrder } from '@/lib/types'
import { WorkOrderTimeline } from '@/components/work-order-timeline'
import { EquipoIntakeFields } from '@/components/equipo-intake-fields'
import { SchoolCombobox } from '@/components/school-combobox'
import { todayInArgentina, hasReliableCreatedAt, grupoDeHoy } from '@/lib/timezone'
import { nativeSelectClass } from '@/lib/utils'

export function WorkOrderForm({
  tipo,
  profiles,
  schools,
  workOrder,
  trigger,
  isAdmin = false,
  currentProfileId = null,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  escuelaActiva = null,
  proximoCodigo,
  rolesByProfile = {},
}: {
  tipo: TipoOT
  profiles: Profile[]
  schools?: School[]
  workOrder?: WorkOrder
  trigger?: React.ReactElement
  isAdmin?: boolean
  currentProfileId?: string | null
  /** Si se pasan, el modal queda controlado desde afuera (ver TableroBoard). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Escuela con la que el grupo está trabajando hoy en Territorio -- se
   * precarga solo al crear una OT nueva, nunca al editar una existente. */
  escuelaActiva?: School | null
  /** Código que le va a tocar a la próxima OT nueva (calculado en el
   * server con la misma lógica que el trigger de la base) -- solo se
   * muestra al crear, nunca al editar una existente. */
  proximoCodigo?: string
  /** Roles del día (Asistencia) por alumno -- se usa en la línea de
   * tiempo para sugerir quién completó cada paso según su rol asignado. */
  rolesByProfile?: Record<string, DailyRoleName[]>
}) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChangeProp ?? setOpenState
  const [pending, startTransition] = useTransition()
  const [cambiandoTipo, startCambioTipo] = useTransition()
  const [grupo, setGrupo] = useState(workOrder?.grupo ?? grupoDeHoy() ?? '')
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
      {openProp === undefined && (
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
      )}
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto sm:max-w-lg">
        {/* DialogContent es un grid con gap-4: cada hijo directo es su
            propia fila, cuya altura (el "contenedor" del sticky) es solo
            la de su propio contenido. Por eso todo va envuelto acá en un
            único hijo -- así el bloque sticky con el número de OT tiene
            como contenedor efectivo a TODO el alto del formulario, y no
            se pierde ni se superpone con el contenido de abajo al
            scrollear (el gap-4 se replica a mano con flex/gap-4). */}
        <div className="flex flex-col gap-4">
          {/* Sticky para que el número de OT quede siempre visible al bajar
              por el formulario -- si no, se pierde de vista justo cuando
              más se lo necesita (para copiarlo/anotarlo). z-10 para que
              quede siempre por encima de campos del formulario con su
              propio position (ej. el combobox de escuela), que si no
              terminan pintándose por encima del fondo de esta barra. */}
          <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b border-border bg-popover px-4 pt-4 pr-10 pb-3">
            <DialogTitle className="font-heading">
              {workOrder ? `Editar ${workOrder.codigo}` : `Nueva OT de ${tipo}`}
            </DialogTitle>
            {!workOrder && proximoCodigo && (
              <p className="font-heading text-2xl font-bold tracking-tight text-primary">
                {proximoCodigo}
              </p>
            )}
          </div>
          <DialogHeader>
            <DialogDescription>
              {workOrder
                ? hasReliableCreatedAt(workOrder.created_at)
                  ? `Creada el ${formatDate(workOrder.fecha)} a las ${formatHoraArgentina(workOrder.created_at)}${workOrder.session ? ` · Sesión #${workOrder.session.sesion_n}` : ''}.`
                  : `Creada el ${formatDate(workOrder.fecha)}${workOrder.session ? ` · Sesión #${workOrder.session.sesion_n}` : ''}.`
                : tipo === 'taller'
                  ? 'Registrá una intervención sobre un equipo en el taller.'
                  : 'Registrá una intervención en territorio (escuela).'}
            </DialogDescription>
            {isAdmin && workOrder?.last_edited_by_profile && workOrder.last_edited_at && (
              <p className="text-[11px] text-muted-foreground">
                Última edición: {workOrder.last_edited_by_profile.apellido_nombre} ·{' '}
                {formatDate(workOrder.last_edited_at)} {formatHoraArgentina(workOrder.last_edited_at)}
              </p>
            )}
            {isAdmin && workOrder && (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2 text-xs">
                <span className="text-muted-foreground">
                  Tipo actual: <strong className="text-foreground capitalize">{workOrder.tipo}</strong>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  disabled={cambiandoTipo}
                  onClick={() => {
                    const nuevoTipo = workOrder.tipo === 'taller' ? 'territorio' : 'taller'
                    startCambioTipo(async () => {
                      const result = await changeWorkOrderTipo(workOrder.id, nuevoTipo)
                      if (result.ok) {
                        toast.success(
                          `${workOrder.codigo} ahora es de tipo ${nuevoTipo} -- se movió a esa sección.`,
                        )
                        router.refresh()
                      } else {
                        toast.error(result.error)
                      }
                    })
                  }}
                >
                  Pasar a {workOrder.tipo === 'taller' ? 'territorio' : 'taller'}
                </Button>
              </div>
            )}
          </DialogHeader>
          <form action={handleSubmit}>
            <input type="hidden" name="tipo" value={tipo} />
            <FieldGroup>
              {workOrder ? (
                <Field>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel>Equipo</FieldLabel>
                    {isAdmin && workOrder.equipment && (
                      <EditEquipmentButton equipment={workOrder.equipment} compact />
                    )}
                  </div>
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
                    defaultSchool={workOrder ? (workOrder.school ?? null) : escuelaActiva}
                  />
                </Field>
              )}
  
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field className="min-w-0">
                  <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
                  <Input
                    id="fecha"
                    name="fecha"
                    type="date"
                    className="w-full min-w-0"
                    defaultValue={workOrder?.fecha ?? todayInArgentina()}
                  />
                </Field>
                <Field className="min-w-0">
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
  
              {workOrder ? (
                <Field>
                  <FieldLabel>
                    Estado ({WORK_ORDER_STATUS_STYLE[workOrder.estado].label})
                  </FieldLabel>
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
                    rolesByProfile={rolesByProfile}
                    desbloqueoSkipMotivo={motivoSinDesbloqueo(workOrder.equipment)}
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
                        {WORK_ORDER_STATUS_STYLE[e].label}
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
                        {WORK_ORDER_STATUS_STYLE[e].label}
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
                  placeholder="Qué problema tiene el equipo. Ej: no enciende, pantalla rota, falta instalar el SO"
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
                    placeholder="Qué se hizo para resolverlo. Ej: se cambió la pila, se reinstaló Windows"
                    rows={2}
                  />
                </Field>
              )}
  
              <Field>
                <FieldLabel htmlFor="observaciones">Observaciones</FieldLabel>
                <Textarea
                  id="observaciones"
                  name="observaciones"
                  defaultValue={workOrder?.observaciones ?? ''}
                  placeholder="Cualquier detalle extra que no entre en diagnóstico o trabajo realizado. Ej: falta un tornillo de la tapa"
                  rows={2}
                />
              </Field>
            </FieldGroup>
  
            <DialogFooter className="mt-4">
              {workOrder && isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive sm:mr-auto sm:w-auto"
                        disabled={pending}
                      />
                    }
                  >
                    <Trash2 data-icon="inline-start" />
                    Borrar OT
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Borrar la OT {workOrder.codigo}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={handleDelete}>
                        Borrar OT
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <DialogClose render={<Button variant="outline" type="button" />}>
                Cancelar
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? 'Guardando…' : workOrder ? 'Guardar cambios' : 'Crear OT'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
