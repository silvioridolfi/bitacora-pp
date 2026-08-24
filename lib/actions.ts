'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  WORK_ORDER_PASO_INFO,
  WORK_ORDER_PASOS_BLOQUEANTES,
  PROGRAMAS_NETBOOK,
  EXCLUSIVE_DAILY_ROLES,
} from '@/lib/types'
import { isAttendanceLocked, isPastNineAmArgentina, isWithinWorkOrderEditHours, todayInArgentina } from '@/lib/timezone'
import { getCurrentProfile } from '@/lib/data'
import type {
  DailyRoleName,
  EstadoAsistencia,
  Grupo,
  ProgramaNetbook,
  TipoEquipo,
  TipoOT,
  WorkOrderEstado,
  WorkOrderPaso,
} from '@/lib/types'

export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Corta cualquier creación/edición de OT fuera del horario del taller
 * (8:00-13:00), salvo para el admin. Reutilizado en todas las acciones
 * que tocan work_orders/work_order_events.
 */
async function assertWithinWorkOrderEditHours(): Promise<ActionResult | null> {
  const { profile } = await getCurrentProfile()
  if (profile?.is_admin) return null
  if (!isWithinWorkOrderEditHours()) {
    return {
      ok: false,
      error: 'Las OT solo se pueden crear o editar en el horario del taller (8:00 a 13:00).',
    }
  }
  return null
}

export async function createWorkOrder(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }
  const hoursError = await assertWithinWorkOrderEditHours()
  if (hoursError) return hoursError

  const tipo = formData.get('tipo') as TipoOT
  const grupo = (formData.get('grupo') as string) || null
  const responsable_id = (formData.get('responsable_id') as string) || null
  const school_id = (formData.get('school_id') as string) || null
  const fecha = (formData.get('fecha') as string) || null
  const estado = (formData.get('estado') as WorkOrderEstado) || 'Pendiente'
  const diagnostico = (formData.get('diagnostico') as string) || null
  const trabajo_realizado = (formData.get('trabajo_realizado') as string) || null
  const horas_estimadas = formData.get('horas_estimadas')
    ? Number(formData.get('horas_estimadas'))
    : null
  const horas_reales = formData.get('horas_reales')
    ? Number(formData.get('horas_reales'))
    : null
  const observaciones = (formData.get('observaciones') as string) || null

  if (tipo === 'territorio' && !school_id) {
    return { ok: false, error: 'Debe seleccionar una escuela para OT de territorio.' }
  }

  // -- Carga manual del equipo nuevo que ingresa con esta OT --
  const tipo_equipo = (formData.get('tipo_equipo') as TipoEquipo) || 'netbook'
  const programaRaw = (formData.get('programa') as string) || ''
  const programa: ProgramaNetbook | null =
    tipo_equipo === 'netbook' && PROGRAMAS_NETBOOK.includes(programaRaw as ProgramaNetbook)
      ? (programaRaw as ProgramaNetbook)
      : null
  const generacion = tipo_equipo === 'netbook' ? (formData.get('generacion') as string) || null : null
  const marca = (formData.get('equipo_marca') as string) || null
  const modelo = (formData.get('equipo_modelo') as string) || null
  const estado_inicial = (formData.get('estado_inicial') as string) || null
  const sinDatos = formData.get('sin_datos') === 'on'
  let numero_serie = ((formData.get('numero_serie') as string) || '').trim()

  if (sinDatos) {
    numero_serie = `S/D-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  }
  if (!numero_serie) {
    return { ok: false, error: 'El N° de serie es obligatorio (usá S/D si es ilegible).' }
  }

  const { data: newEquipment, error: equipmentError } = await supabase
    .from('equipment')
    .insert({
      numero_serie,
      tipo_equipo,
      programa,
      generacion,
      marca,
      modelo,
      estado_inicial,
      grupo,
      fecha_ingreso: fecha ?? todayInArgentina(),
    })
    .select('id')
    .single()

  if (equipmentError) {
    if (equipmentError.code === '23505') {
      return { ok: false, error: `Ya existe un equipo cargado con el N° de serie ${numero_serie}.` }
    }
    return { ok: false, error: equipmentError.message }
  }

  const { error } = await supabase.from('work_orders').insert({
    tipo,
    equipment_id: newEquipment.id,
    grupo,
    responsable_id,
    grupo_creador: grupo,
    responsable_original_id: responsable_id,
    school_id: tipo === 'territorio' ? school_id : null,
    fecha,
    estado,
    diagnostico,
    trabajo_realizado,
    horas_estimadas,
    horas_reales,
    observaciones,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/taller')
  revalidatePath('/territorio')
  revalidatePath('/tablero')
  revalidatePath('/dashboard')
  revalidatePath('/equipos')
  return { ok: true }
}

export async function updateWorkOrder(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }
  const hoursError = await assertWithinWorkOrderEditHours()
  if (hoursError) return hoursError

  const grupo = (formData.get('grupo') as string) || null
  const responsable_id = (formData.get('responsable_id') as string) || null
  const school_id = (formData.get('school_id') as string) || null
  const fecha = (formData.get('fecha') as string) || null
  const estado = (formData.get('estado') as WorkOrderEstado) || 'Pendiente'
  const diagnostico = (formData.get('diagnostico') as string) || null
  const trabajo_realizado = (formData.get('trabajo_realizado') as string) || null
  const horas_estimadas = formData.get('horas_estimadas')
    ? Number(formData.get('horas_estimadas'))
    : null
  const horas_reales = formData.get('horas_reales')
    ? Number(formData.get('horas_reales'))
    : null
  const observaciones = (formData.get('observaciones') as string) || null

  const { error } = await supabase
    .from('work_orders')
    .update({
      grupo,
      responsable_id,
      school_id,
      fecha,
      estado,
      diagnostico,
      trabajo_realizado,
      horas_estimadas,
      horas_reales,
      observaciones,
      last_edited_by: userData.user.id,
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/taller')
  revalidatePath('/territorio')
  revalidatePath('/tablero')
  revalidatePath('/dashboard')
  revalidatePath('/equipos')
  return { ok: true }
}

/**
 * Tilda un paso de la línea de tiempo de la OT (bloqueante o no). Si el
 * paso es bloqueante (forma parte del pipeline), además avanza el estado
 * de la OT al que corresponde. 'Otro' puede repetirse con descripciones
 * distintas; el resto de los pasos son de una sola vez por OT.
 */
export async function toggleWorkOrderEvent(
  workOrderId: string,
  clave: WorkOrderPaso,
  profileId: string | null,
  descripcion: string | null = null,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }
  const hoursError = await assertWithinWorkOrderEditHours()
  if (hoursError) return hoursError

  const { error: insertError } = await supabase.from('work_order_events').insert({
    work_order_id: workOrderId,
    clave,
    profile_id: profileId,
    descripcion,
  })

  if (insertError) return { ok: false, error: insertError.message }

  const resultingEstado = WORK_ORDER_PASO_INFO[clave].resultingEstado
  if (resultingEstado) {
    const { error: estadoError } = await supabase
      .from('work_orders')
      .update({ estado: resultingEstado })
      .eq('id', workOrderId)

    if (estadoError) return { ok: false, error: estadoError.message }
  }

  revalidatePath('/taller')
  revalidatePath('/territorio')
  revalidatePath('/tablero')
  revalidatePath('/dashboard')
  revalidatePath('/equipos')
  return { ok: true }
}

/**
 * Saca un paso ya tildado (excepto 'otro', que puede tener varias filas --
 * ver removeWorkOrderEventById para ese caso). Si era un paso bloqueante,
 * recalcula el estado a partir de los pasos bloqueantes que queden. Si no
 * queda ninguno, no toca el estado (podría ser un valor cargado a mano,
 * sin historial -- más seguro no tocar que pisarlo con un valor incorrecto).
 */
export async function removeWorkOrderEvent(
  workOrderId: string,
  clave: WorkOrderPaso,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }
  const hoursError = await assertWithinWorkOrderEditHours()
  if (hoursError) return hoursError

  const { error: deleteError } = await supabase
    .from('work_order_events')
    .delete()
    .eq('work_order_id', workOrderId)
    .eq('clave', clave)

  if (deleteError) return { ok: false, error: deleteError.message }

  if (WORK_ORDER_PASOS_BLOQUEANTES.includes(clave)) {
    const { data: remaining } = await supabase
      .from('work_order_events')
      .select('clave')
      .eq('work_order_id', workOrderId)

    const completed = new Set((remaining ?? []).map((r) => r.clave as WorkOrderPaso))

    let estado: WorkOrderEstado | null = null
    for (const p of WORK_ORDER_PASOS_BLOQUEANTES) {
      if (completed.has(p)) estado = WORK_ORDER_PASO_INFO[p].resultingEstado
    }

    if (estado) {
      const { error: estadoError } = await supabase
        .from('work_orders')
        .update({ estado })
        .eq('id', workOrderId)

      if (estadoError) return { ok: false, error: estadoError.message }
    }
  }

  revalidatePath('/taller')
  revalidatePath('/territorio')
  revalidatePath('/tablero')
  revalidatePath('/dashboard')
  revalidatePath('/equipos')
  return { ok: true }
}

/** Borra una fila puntual de 'Otro' (puede haber varias por OT). */
export async function removeWorkOrderEventById(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }
  const hoursError = await assertWithinWorkOrderEditHours()
  if (hoursError) return hoursError

  const { error } = await supabase.from('work_order_events').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/taller')
  revalidatePath('/territorio')
  revalidatePath('/tablero')
  return { ok: true }
}

export async function setAttendance(
  studentId: string,
  sessionId: string,
  estado: EstadoAsistencia,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

  const { data: session } = await supabase
    .from('sessions')
    .select('fecha')
    .eq('id', sessionId)
    .maybeSingle()

  const { profile } = await getCurrentProfile()
  const isAdmin = profile?.is_admin ?? false

  if (!isAdmin && session?.fecha && isAttendanceLocked(session.fecha)) {
    return {
      ok: false,
      error: 'Esta fecha ya está cerrada (pasado el mediodía) y no se puede modificar.',
    }
  }

  if (!isAdmin && estado === 'Presente') {
    if (session?.fecha === todayInArgentina() && isPastNineAmArgentina()) {
      return {
        ok: false,
        error: 'Ya pasaron las 9:00 -- solo se puede marcar Tardanza o Ausente.',
      }
    }
  }

  const { error } = await supabase.from('attendance').upsert(
    {
      student_id: studentId,
      session_id: sessionId,
      estado,
    },
    { onConflict: 'student_id,session_id' },
  )

  if (error) return { ok: false, error: error.message }

  revalidatePath('/asistencia')
  revalidatePath('/ranking')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function createSession(grupo: Grupo, fecha: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

  const { data: existing } = await supabase
    .from('sessions')
    .select('sesion_n')
    .eq('grupo', grupo)
    .order('sesion_n', { ascending: false })
    .limit(1)

  const nextSesionN = ((existing ?? [])[0]?.sesion_n ?? 0) + 1

  const { error } = await supabase.from('sessions').insert({
    grupo,
    fecha,
    sesion_n: nextSesionN,
    horas: 4,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/asistencia')
  revalidatePath('/ranking')
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Asigna un rol del día a un alumno para una sesión. Para roles exclusivos
 * (Líder, Documentador) primero saca a quien lo tuviera antes, así queda
 * un solo titular. Para el resto, simplemente lo tilda (puede haber varios
 * alumnos con el mismo rol, y un alumno con varios roles).
 */
export async function assignDailyRole(
  sessionId: string,
  studentId: string,
  rol: DailyRoleName,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

  if (EXCLUSIVE_DAILY_ROLES.includes(rol)) {
    const { error: delError } = await supabase
      .from('daily_roles')
      .delete()
      .eq('session_id', sessionId)
      .eq('rol', rol)
    if (delError) return { ok: false, error: delError.message }
  }

  const { error } = await supabase.from('daily_roles').insert({
    session_id: sessionId,
    student_id: studentId,
    rol,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/asistencia')
  revalidatePath('/tablero')
  revalidatePath('/taller')
  return { ok: true }
}

/** Saca un rol del día (sin reemplazarlo). */
export async function removeDailyRole(
  sessionId: string,
  studentId: string,
  rol: DailyRoleName,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

  const { error } = await supabase
    .from('daily_roles')
    .delete()
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .eq('rol', rol)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/asistencia')
  revalidatePath('/tablero')
  revalidatePath('/taller')
  return { ok: true }
}

/**
 * Borra una OT (solo admin). Saca primero sus etapas/acciones para no
 * chocar con el FK, aunque ya tienen ON DELETE CASCADE -- explícito por
 * claridad. No borra el equipo asociado, puede haber quedado con otras OT.
 */
export async function deleteWorkOrder(id: string): Promise<ActionResult> {
  const { profile } = await getCurrentProfile()
  if (!profile?.is_admin) return { ok: false, error: 'Solo el FED puede borrar una OT.' }

  const supabase = await createClient()
  const { error } = await supabase.from('work_orders').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/taller')
  revalidatePath('/territorio')
  revalidatePath('/tablero')
  revalidatePath('/dashboard')
  revalidatePath('/equipos')
  return { ok: true }
}

/**
 * Borra una fecha/sesión de asistencia (solo admin). Cascadea a
 * attendance y daily_roles de esa sesión.
 */
export async function deleteSession(id: string): Promise<ActionResult> {
  const { profile } = await getCurrentProfile()
  if (!profile?.is_admin) return { ok: false, error: 'Solo el FED puede borrar una fecha.' }

  const supabase = await createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/asistencia')
  revalidatePath('/ranking')
  revalidatePath('/dashboard')
  revalidatePath('/tablero')
  revalidatePath('/taller')
  return { ok: true }
}
