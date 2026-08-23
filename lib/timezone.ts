export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires'

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
