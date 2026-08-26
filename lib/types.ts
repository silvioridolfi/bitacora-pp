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

export const TIPOS_EQUIPO = ['netbook', 'tablet', 'notebook', 'pc', 'otro'] as const
export type TipoEquipo = (typeof TIPOS_EQUIPO)[number]

export const TIPO_EQUIPO_LABEL: Record<TipoEquipo, string> = {
  netbook: 'Netbook',
  tablet: 'Tablet',
  notebook: 'Notebook',
  pc: 'PC',
  otro: 'Otro',
}

export const PROGRAMAS_NETBOOK = [
  'Aprender Conectados',
  'Conectar Igualdad',
  'Conectar Igualdad 2023',
  'Juana Manso',
  'PAD',
  'Primaria Digital',
] as const
export type ProgramaNetbook = (typeof PROGRAMAS_NETBOOK)[number]

/** Prefijo esperado del N° de serie según el programa de la netbook. */
export const PROGRAMA_SERIE_PREFIX: Record<ProgramaNetbook, string> = {
  'Conectar Igualdad': 'AA',
  'Primaria Digital': 'EDU',
  PAD: 'SZSES10IS',
  'Aprender Conectados': 'AA',
  'Juana Manso': 'AA',
  'Conectar Igualdad 2023': 'AA',
}

export const GENERACIONES_NETBOOK = Array.from({ length: 10 }, (_, i) => `G${i + 1}`)

export const MARCAS_NETBOOK = [
  'Banghó',
  'BGH',
  'Coradir',
  'CX',
  'Depot',
  'Edunec',
  'EXO',
  'Haier',
  'Ken Brown',
  'Lenovo',
  'NBX',
  'Noblex',
  'Novatech',
  'PCBox',
  'PULSArE',
  'Samsung',
  'SUA',
] as const

export const ESTADOS_INICIALES_EQUIPO = [
  'Sin diagnosticar',
  'No enciende',
  'Pantalla no enciende',
  'Se apaga solo / no mantiene carga',
  'Bloqueada',
  'Enciende sin bloqueo',
  'Enciende con fallas',
  'Sin sistema operativo',
  'Pantalla rota',
  'Carcasa dañada / bisagra rota',
  'Rota físicamente',
] as const
export type EstadoInicialEquipo = (typeof ESTADOS_INICIALES_EQUIPO)[number]

export type Equipment = {
  id: string
  numero_serie: string
  formato_ok: boolean | null
  generacion: string | null
  modelo: string | null
  marca: string | null
  fecha_ingreso: string | null
  estado_inicial: string | null
  /** Se calcula solo (trigger) a partir de la OT más reciente -- no editable a mano. */
  estado_actual: string | null
  grupo: string | null
  observaciones_tecnicas: string | null
  historial_legado: string | null
  tipo_equipo: TipoEquipo
  programa: ProgramaNetbook | null
  created_at: string
}

export type TipoOT = 'taller' | 'territorio'

export const WORK_ORDER_ESTADOS = [
  'Pendiente',
  'Diagnosticando',
  'Desbloqueada',
  'Instalando SO',
  'Pendiente de Instalación de SO',
  'Configurando',
  'Probando',
  'Finalizada OK',
  'Derivada',
] as const

export type WorkOrderEstado = (typeof WORK_ORDER_ESTADOS)[number]

/**
 * Línea de tiempo única por OT: cada paso puede mover el estado del
 * pipeline (bloqueante) o ser solo un detalle técnico opcional que se
 * documenta sin afectar el estado (no bloqueante). Reemplaza los dos
 * sistemas paralelos que había antes (etapas + checklist de acciones),
 * que se solapaban conceptualmente (ej. 'Desbloqueo' existía en ambos).
 */
export const WORK_ORDER_PASOS = [
  'desarme',
  'desbloqueo',
  'armado',
  'prueba_encendido',
  'instalacion_so',
  'cambio_pila',
  'otro',
] as const

export type WorkOrderPaso = (typeof WORK_ORDER_PASOS)[number]

export const WORK_ORDER_PASO_INFO: Record<
  WorkOrderPaso,
  {
    label: string
    rol: string
    resultingEstado: WorkOrderEstado | null
    reservada?: boolean
    permiteDescripcion?: boolean
  }
> = {
  desarme: { label: 'Desarme', rol: 'Técnico', resultingEstado: 'Diagnosticando' },
  desbloqueo: {
    label: 'Desbloqueo',
    rol: 'FED (rol reservado)',
    resultingEstado: 'Desbloqueada',
    reservada: true,
  },
  armado: { label: 'Armado', rol: 'Técnico', resultingEstado: 'Probando' },
  prueba_encendido: {
    label: 'Prueba de encendido',
    rol: 'Alumno',
    resultingEstado: 'Instalando SO',
  },
  instalacion_so: { label: 'Instalación de SO', rol: 'Alumno', resultingEstado: 'Finalizada OK' },
  cambio_pila: {
    label: 'Cambio de pila',
    rol: 'Técnico',
    resultingEstado: null,
  },
  otro: {
    label: 'Otro',
    rol: '',
    resultingEstado: null,
    permiteDescripcion: true,
  },
}

/** Pasos que forman parte de la secuencia obligatoria del pipeline (mueven el estado). */
export const WORK_ORDER_PASOS_BLOQUEANTES: WorkOrderPaso[] = [
  'desarme',
  'desbloqueo',
  'armado',
  'prueba_encendido',
  'instalacion_so',
]

export type WorkOrderEvent = {
  id: string
  work_order_id: string
  clave: WorkOrderPaso
  descripcion: string | null
  profile_id: string | null
  completed_at: string
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
  /** Fijo desde la creación -- nunca se pisa aunque se reasigne la OT a otro grupo. */
  grupo_creador: string | null
  /** Fijo desde la creación -- nunca se pisa aunque se reasigne el responsable. */
  responsable_original_id: string | null
  /** Quién hizo la última edición del encabezado de la OT, y cuándo. */
  last_edited_by: string | null
  last_edited_at: string | null
  /** Se calcula solo (trigger), matcheando grupo+fecha con una sesión de asistencia real. */
  session_id: string | null
  created_at: string
  // Joined
  responsable?: Profile | null
  responsable_original?: Profile | null
  last_edited_by_profile?: Profile | null
  session?: Session | null
  school?: School | null
  equipment?: Equipment | null
  work_order_events?: WorkOrderEvent[]
}

export type Session = {
  id: string
  fecha: string
  grupo: Grupo
  sesion_n: number
  horas: number
  created_at: string
}

export const ESTADO_ASISTENCIA_OPTIONS = ['Presente', 'Tardanza', 'Ausente'] as const

export type EstadoAsistencia = (typeof ESTADO_ASISTENCIA_OPTIONS)[number]

export type Attendance = {
  id: string
  student_id: string
  session_id: string
  estado: EstadoAsistencia
  created_at: string
}

export const DAILY_ROLES = [
  'Líder',
  'Documentador',
  'Técnico',
  'Tester/Instalador',
  'Control de Calidad',
] as const
export type DailyRoleName = (typeof DAILY_ROLES)[number]

/** Roles de los que solo puede haber un titular por sesión. */
export const EXCLUSIVE_DAILY_ROLES: DailyRoleName[] = ['Líder', 'Documentador']

export type DailyRole = {
  id: string
  session_id: string
  student_id: string
  rol: DailyRoleName
  created_at: string
  student?: Profile | null
}
