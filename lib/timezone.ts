export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Grupo que corresponde al día de hoy (hora Argentina): G1 va lunes y
 * miércoles, G2 martes y jueves, de 8 a 12. Devuelve null los demás
 * días (viernes a domingo) -- ahí no hay grupo "de hoy" para inferir.
 * Se usa para precargar el campo Grupo al crear una OT nueva, y para
 * abrir Asistencia directo en la pestaña que corresponde, sin
 * obligar a elegirlo a mano cada vez.
 */
export function grupoDeHoy(): 'Grupo 1' | 'Grupo 2' | null {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  }).format(new Date())

  if (weekday === 'Mon' || weekday === 'Wed') return 'Grupo 1'
  if (weekday === 'Tue' || weekday === 'Thu') return 'Grupo 2'
  return null
}

/**
 * Las OT migradas desde la planilla vieja (dos tandas: 16/08 y 23/08)
 * quedaron con un created_at artificial -- el momento exacto en que se
 * corrió el script de migración, no la hora real en que se cargaron en
 * su momento (la planilla nunca guardó esa hora). Cualquier OT anterior
 * a este corte no tiene una hora de creación confiable; a partir de acá,
 * toda OT se crea en tiempo real desde la app y sí es un dato real.
 */
export const WORK_ORDER_CREATED_AT_RELIABLE_SINCE = '2026-08-24T11:30:00.000Z'

export function hasReliableCreatedAt(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  return createdAt >= WORK_ORDER_CREATED_AT_RELIABLE_SINCE
}

/**
 * Fecha de "hoy" en horario de Argentina, como string YYYY-MM-DD
 * (formato que usan los <input type="date"> y las columnas `date` de Postgres).
 * Usar esto en vez de `new Date().toISOString().slice(0, 10)`, que toma la
 * fecha en UTC y puede quedar un día adelantada durante la noche argentina.
 */
export function todayInArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * true si ya son las 9:00 o más, hora de Argentina. Usado para no permitir
 * marcar "Presente" pasado ese horario en la fecha de hoy.
 */
export function isPastNineAmArgentina(): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  )
  return hour >= 9
}

/**
 * true si ya son las 12:00 o más, hora de Argentina. Usado para bloquear
 * por completo la edición de asistencia de la fecha de hoy pasado el
 * mediodía, y así evitar que se modifiquen (a propósito o sin querer)
 * asistencias ya cerradas.
 */
export function isPastNoonArgentina(): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  )
  return hour >= 12
}

/**
 * true si la fecha de una sesión de asistencia ya no se puede editar:
 * cualquier fecha anterior a hoy, o la de hoy pasado el mediodía.
 */
export function isAttendanceLocked(fecha: string): boolean {
  const today = todayInArgentina()
  if (fecha < today) return true
  if (fecha === today && isPastNoonArgentina()) return true
  return false
}

/**
 * true si la hora actual (Argentina) está dentro del horario del taller
 * (8:00 a 13:00). Fuera de esa ventana, los alumnos no pueden crear ni
 * editar OT -- pensado para evitar que alguien entre de noche o el fin
 * de semana a tocar OT de cualquier grupo sin supervisión. El admin no
 * tiene esta restricción.
 */
export function isWithinWorkOrderEditHours(): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  )
  return hour >= 8 && hour < 13
}
