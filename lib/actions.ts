'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { EstadoAsistencia, TipoOT, WorkOrderEstado } from '@/lib/types'

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function createWorkOrder(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

  const tipo = formData.get('tipo') as TipoOT
  const equipment_id = (formData.get('equipment_id') as string) || null
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

  if (!equipment_id) return { ok: false, error: 'Debe seleccionar un equipo.' }
  if (tipo === 'territorio' && !school_id) {
    return { ok: false, error: 'Debe seleccionar una escuela para OT de territorio.' }
  }

  const { error } = await supabase.from('work_orders').insert({
    tipo,
    equipment_id,
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

  const equipment_id = (formData.get('equipment_id') as string) || null
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
      equipment_id,
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

export async function setAttendance(
  studentId: string,
  sessionId: string,
  estado: EstadoAsistencia,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'No hay sesión activa.' }

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
