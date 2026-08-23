export type Grupo = 'Grupo 1' | 'Grupo 2'

export type Profile = {
  id: string
  apellido_nombre: string
  grupo: Grupo | null
  is_admin: boolean
  dias: string | null
  created_at: string
}

export type School = {
  id: string
  cue: number | null
  nombre: string
  distrito: string | null
  nombre_completo: string | null
}

export type Equipment = {
  id: string
  numero_serie: string
  formato_ok: boolean | null
  generacion: string | null
  modelo: string | null
  marca: string | null
  fecha_ingreso: string | null
  estado_inicial: string | null
  estado_actual: string | null
  grupo: string | null
  observaciones_tecnicas: string | null
  historial_legado: string | null
  created_at: string
}

export type TipoOT = 'taller' | 'territorio'

export const WORK_ORDER_ESTADOS = [
  'Pendiente',
  'Diagnosticando',
  'Desbloqueada',
  'Instalando SO',
  'Configurando',
  'Probando',
  'Finalizada OK',
  'Derivada',
] as const

export type WorkOrderEstado = (typeof WORK_ORDER_ESTADOS)[number]

export const WORK_ORDER_ETAPAS = [
  'desarme',
  'desbloqueo',
  'armado',
  'prueba_encendido',
  'instalacion_so',
] as const

export type WorkOrderEtapa = (typeof WORK_ORDER_ETAPAS)[number]

export const WORK_ORDER_ETAPA_INFO: Record<
  WorkOrderEtapa,
  { label: string; rol: string; resultingEstado: WorkOrderEstado; reservada?: boolean }
> = {
  desarme: {
    label: 'Desarme',
    rol: 'Técnico',
    resultingEstado: 'Diagnosticando',
  },
  desbloqueo: {
    label: 'Desbloqueo',
    rol: 'Coordinador (rol reservado)',
    resultingEstado: 'Desbloqueada',
    reservada: true,
  },
  armado: {
    label: 'Armado y cambio de pila',
    rol: 'Técnico',
    resultingEstado: 'Probando',
  },
  prueba_encendido: {
    label: 'Prueba de encendido',
    rol: 'Alumno',
    resultingEstado: 'Instalando SO',
  },
  instalacion_so: {
    label: 'Instalación de SO',
    rol: 'Alumno',
    resultingEstado: 'Finalizada OK',
  },
}

export type WorkOrderStage = {
  id: string
  work_order_id: string
  etapa: WorkOrderEtapa
  profile_id: string | null
  completed_at: string
  created_at: string
  profile?: Profile | null
}

export type WorkOrder = {
  id: string
  codigo: string
  tipo: TipoOT
  fecha: string | null
  equipment_id: string | null
  grupo: string | null
  responsable_id: string | null
  school_id: string | null
  estado: WorkOrderEstado
  diagnostico: string | null
  trabajo_realizado: string | null
  horas_estimadas: number | null
  horas_reales: number | null
  observaciones: string | null
  historial_legado: string | null
  created_at: string
  // Joined
  responsable?: Profile | null
  school?: School | null
  equipment?: Equipment | null
  work_order_actions?: WorkOrderAction[]
  work_order_stages?: WorkOrderStage[]
}

export const WORK_ORDER_ACCIONES = [
  'Desbloqueo',
  'Cambio de Pila',
  'Actualización de SO',
  'Diagnóstico',
  'Otro',
] as const

export type WorkOrderAccion = (typeof WORK_ORDER_ACCIONES)[number]

export type WorkOrderAction = {
  id: string
  work_order_id: string
  accion: WorkOrderAccion
  fecha: string | null
  descripcion: string | null
  created_at: string
}

export type Session = {
  id: string
  fecha: string
  grupo: Grupo
  sesion_n: number
  horas: number
  created_at: string
}

export const ESTADO_ASISTENCIA_OPTIONS = [
  'Presente',
  'Tardanza',
  'Justificado',
  'Ausente',
] as const

export type EstadoAsistencia = (typeof ESTADO_ASISTENCIA_OPTIONS)[number]

export type Attendance = {
  id: string
  student_id: string
  session_id: string
  estado: EstadoAsistencia
  created_at: string
}
