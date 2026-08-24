/**
 * Formatea una columna `date` de Postgres (YYYY-MM-DD, sin hora ni timezone)
 * a DD/MM/AAAA. Se parsea el string directamente, sin pasar por el objeto
 * Date del runtime, para que el resultado no dependa de en qué timezone
 * esté corriendo el servidor (Vercel corre en UTC por defecto).
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return '—'
  const [, yyyy, mm, dd] = match
  return `${dd}/${mm}/${yyyy}`
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return '—'
  const [, , mm, dd] = match
  return `${dd}/${mm}`
}

export function formatHoraArgentina(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatMinutos(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value} min`
}
