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
 * Timestamp completo (fecha y hora) en horario de Argentina, en formato
 * DD/MM/AAAA HH:mm. Para columnas timestamptz (ej. created_at).
 */
export function formatDateTimeArgentina(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
  return parts
}
