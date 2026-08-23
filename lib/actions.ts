'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { WORK_ORDER_ETAPA_INFO, WORK_ORDER_ETAPAS, PROGRAMAS_NETBOOK } from '@/lib/types'
import { isPastNineAmArgentina, todayInArgentina } from '@/lib/timezone'
import type {
  EstadoAsistencia,
  Grupo,
  ProgramaNetbook,
  TipoEquipo,
  TipoOT,
  WorkOrderAccion,
  WorkOrderEstado,
  WorkOrderEtapa,
} from '@/lib/types'

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function createWorkOrder(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

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

export async function completeWorkOrderStage(
  workOrderId: string,
  etapa: WorkOrderEtapa,
  profileId: string | null,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

  const { error: stageError } = await supabase.from('work_order_stages').insert({
    work_order_id: workOrderId,
    etapa,
    profile_id: profileId,
  })

  if (stageError) return { ok: false, error: stageError.message }

  const resultingEstado = WORK_ORDER_ETAPA_INFO[etapa].resultingEstado
  const { error: estadoError } = await supabase
    .from('work_orders')
    .update({ estado: resultingEstado })
    .eq('id', workOrderId)

  if (estadoError) return { ok: false, error: estadoError.message }

  revalidatePath('/taller')
  revalidatePath('/tablero')
  revalidatePath('/dashboard')
  revalidatePath('/equipos')
  return { ok: true }
}

export async function undoWorkOrderStage(
  workOrderId: string,
  etapa: WorkOrderEtapa,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

  const { error: deleteError } = await supabase
    .from('work_order_stages')
    .delete()
    .eq('work_order_id', workOrderId)
    .eq('etapa', etapa)

  if (deleteError) return { ok: false, error: deleteError.message }

  const { data: remaining } = await supabase
    .from('work_order_stages')
    .select('etapa')
    .eq('work_order_id', workOrderId)

  const completed = new Set((remaining ?? []).map((r) => r.etapa as WorkOrderEtapa))
  let estado: WorkOrderEstado = 'Pendiente'
  for (const e of WORK_ORDER_ETAPAS) {
    if (completed.has(e)) estado = WORK_ORDER_ETAPA_INFO[e].resultingEstado
  }

  const { error: estadoError } = await supabase
    .from('work_orders')
    .update({ estado })
    .eq('id', workOrderId)

  if (estadoError) return { ok: false, error: estadoError.message }

  revalidatePath('/taller')
  revalidatePath('/tablero')
  revalidatePath('/dashboard')
  revalidatePath('/equipos')
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

  if (estado === 'Presente') {
    const { data: session } = await supabase
      .from('sessions')
      .select('fecha')
      .eq('id', sessionId)
      .maybeSingle()

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
 * Tilda/destilda una acción del checklist "qué se hizo" de una OT.
 * A diferencia de las etapas del pipeline, estas no son secuenciales ni
 * excluyentes entre sí -- documentan intervenciones puntuales sobre el
 * equipo (cambio de pila, actualización de SO, etc.) para el historial.
 */
export async function toggleWorkOrderAction(
  workOrderId: string,
  accion: WorkOrderAccion,
  descripcion: string | null,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

  const { data: existing } = await supabase
    .from('work_order_actions')
    .select('id')
    .eq('work_order_id', workOrderId)
    .eq('accion', accion)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('work_order_actions')
      .delete()
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('work_order_actions').insert({
      work_order_id: workOrderId,
      accion,
      fecha: todayInArgentina(),
      descripcion,
    })
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/taller')
  revalidatePath('/territorio')
  revalidatePath('/tablero')
  revalidatePath('/equipos')
  return { ok: true }
}
