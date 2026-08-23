import type { EstadoAsistencia, WorkOrderEstado } from '@/lib/types'

type StatusStyle = {
  label: string
  bg: string
  border: string
  text: string
  dot: string
}

export const WORK_ORDER_STATUS_STYLE: Record<WorkOrderEstado, StatusStyle> = {
  Pendiente: {
    label: 'Pendiente',
    bg: 'bg-status-pendiente/10',
    border: 'border-status-pendiente/40',
    text: 'text-status-pendiente',
    dot: 'bg-status-pendiente',
  },
  Diagnosticando: {
    label: 'Diagnosticando',
    bg: 'bg-status-diagnosticando/10',
    border: 'border-status-diagnosticando/40',
    text: 'text-status-diagnosticando',
    dot: 'bg-status-diagnosticando',
  },
  Desbloqueada: {
    label: 'Desbloqueada',
    bg: 'bg-status-desbloqueada/10',
    border: 'border-status-desbloqueada/40',
    text: 'text-status-desbloqueada',
    dot: 'bg-status-desbloqueada',
  },
  'Instalando SO': {
    label: 'Instalando SO',
    bg: 'bg-status-instalando-so/10',
    border: 'border-status-instalando-so/40',
    text: 'text-status-instalando-so',
    dot: 'bg-status-instalando-so',
  },
  Configurando: {
    label: 'Configurando',
    bg: 'bg-status-configurando/10',
    border: 'border-status-configurando/40',
    text: 'text-status-configurando',
    dot: 'bg-status-configurando',
  },
  Probando: {
    label: 'Probando',
    bg: 'bg-status-probando/10',
    border: 'border-status-probando/40',
    text: 'text-status-probando',
    dot: 'bg-status-probando',
  },
  'Finalizada OK': {
    label: 'Finalizada OK',
    bg: 'bg-status-finalizada/10',
    border: 'border-status-finalizada/40',
    text: 'text-status-finalizada',
    dot: 'bg-status-finalizada',
  },
  Derivada: {
    label: 'Derivada',
    bg: 'bg-status-derivada/10',
    border: 'border-status-derivada/40',
    text: 'text-status-derivada',
    dot: 'bg-status-derivada',
  },
}

export const WORK_ORDER_ESTADO_ORDER: WorkOrderEstado[] = [
  'Pendiente',
  'Diagnosticando',
  'Desbloqueada',
  'Probando',
  'Instalando SO',
  'Configurando',
  'Finalizada OK',
  'Derivada',
]

export const ATTENDANCE_STATUS_STYLE: Record<EstadoAsistencia, StatusStyle> = {
  Presente: {
    label: 'Presente',
    bg: 'bg-status-presente/10',
    border: 'border-status-presente/40',
    text: 'text-status-presente',
    dot: 'bg-status-presente',
  },
  Tardanza: {
    label: 'Tardanza',
    bg: 'bg-status-tardanza/10',
    border: 'border-status-tardanza/40',
    text: 'text-status-tardanza',
    dot: 'bg-status-tardanza',
  },
  Ausente: {
    label: 'Ausente',
    bg: 'bg-status-ausente/10',
    border: 'border-status-ausente/40',
    text: 'text-status-ausente',
    dot: 'bg-status-ausente',
  },
}

export const ATTENDANCE_CYCLE: EstadoAsistencia[] = ['Presente', 'Tardanza', 'Ausente']

/**
 * Ciclo de estados disponible para marcar una fecha. Después de las 9:00
 * (hora Argentina) no se puede marcar Presente en una fecha de hoy -- solo
 * quedan Tardanza y Ausente, porque a esa hora ya se considera tarde.
 */
export function attendanceCycleFor(allowPresente: boolean): EstadoAsistencia[] {
  return allowPresente ? ATTENDANCE_CYCLE : ['Tardanza', 'Ausente']
}

export function nextAttendanceStatus(
  current: EstadoAsistencia | null,
  allowPresente: boolean,
): EstadoAsistencia {
  const cycle = attendanceCycleFor(allowPresente)
  if (!current) return cycle[0]
  const idx = cycle.indexOf(current)
  if (idx === -1) return cycle[0]
  return cycle[(idx + 1) % cycle.length]
}

export const RANKING_PUNTOS = {
  taller: 10,
  territorio: 15,
  presente: 10,
  tardanza: -5,
}
