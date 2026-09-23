import { RANKING_PUNTOS } from '@/lib/status'
import { WORK_ORDER_PASOS_BLOQUEANTES } from '@/lib/types'
import type { Attendance, Profile, Session, TipoOT, WorkOrderEvent } from '@/lib/types'

export type FinishedOrder = { id: string; tipo: TipoOT }

export type PodioTier = 'oro' | 'plata' | 'bronce'

/** 1° -> oro, 2° -> plata, 3° -> bronce, el resto no tiene podio. */
export function podioTier(puesto: number): PodioTier | null {
  if (puesto === 1) return 'oro'
  if (puesto === 2) return 'plata'
  if (puesto === 3) return 'bronce'
  return null
}

/** Mismos colores en /ranking y en el perfil de cada alumno -- el oro
 * reusa las clases que ya tenía el 1° puesto en el ranking. */
export const PODIO_STYLE: Record<PodioTier, { bg: string; text: string; ring: string }> = {
  oro: { bg: 'bg-status-pendiente', text: 'text-foreground', ring: 'ring-yellow-400/60' },
  plata: { bg: 'bg-slate-300/40', text: 'text-slate-600', ring: 'ring-slate-400/50' },
  bronce: { bg: 'bg-amber-700/20', text: 'text-amber-700', ring: 'ring-amber-700/40' },
}

/**
 * Reparte los puntos de cada OT Finalizada OK entre los alumnos que
 * completaron pasos en ella, PROPORCIONAL a cuántos pasos hizo cada
 * uno respecto al total de pasos completados en esa OT (no en partes
 * iguales por persona) -- quien hizo más trabajo en una OT se lleva
 * proporcionalmente más. Ej.: OT de 10pts con 4 pasos completados en
 * total, uno hizo 3 y otro hizo 1 -> 7.5pts y 2.5pts, no 5 y 5.
 * 'Desbloqueo' cuenta como cualquier otro paso (ya no es rol fijo del
 * FED); solo queda afuera automáticamente si quien lo hizo es admin,
 * por el filtro de alumnoIds.
 *
 * IMPORTANTE: alumnoIds tiene que incluir a TODOS los que pueden haber
 * contribuido a esas OT (todo el grupo, no solo el alumno que te
 * interesa) -- si le pasás un solo id, el reparto proporcional queda
 * mal calculado porque no ve el trabajo de sus compañeros en la misma OT.
 */
export function puntosPorAlumnoDesdeOTs(
  finishedOrders: FinishedOrder[],
  events: WorkOrderEvent[],
  alumnoIds: Set<string>,
): Map<string, number> {
  const puntos = new Map<string, number>()
  const otById = new Map(finishedOrders.map((o) => [o.id, o]))

  // Por OT: cuántos pasos completó cada alumno.
  const pasosPorOtPorAlumno = new Map<string, Map<string, number>>()
  for (const e of events) {
    if (!e.profile_id || !alumnoIds.has(e.profile_id)) continue
    if (!WORK_ORDER_PASOS_BLOQUEANTES.includes(e.clave)) continue
    const ot = otById.get(e.work_order_id)
    if (!ot) continue
    if (!pasosPorOtPorAlumno.has(ot.id)) pasosPorOtPorAlumno.set(ot.id, new Map())
    const porAlumno = pasosPorOtPorAlumno.get(ot.id)!
    porAlumno.set(e.profile_id, (porAlumno.get(e.profile_id) ?? 0) + 1)
  }

  for (const [otId, porAlumno] of pasosPorOtPorAlumno) {
    const ot = otById.get(otId)!
    const puntosOt = ot.tipo === 'taller' ? RANKING_PUNTOS.taller : RANKING_PUNTOS.territorio
    const totalPasos = [...porAlumno.values()].reduce((acc, n) => acc + n, 0)
    for (const [alumnoId, misPasos] of porAlumno) {
      const asignado = puntosOt * (misPasos / totalPasos)
      puntos.set(alumnoId, (puntos.get(alumnoId) ?? 0) + asignado)
    }
  }

  return puntos
}

export type RankingEntry = {
  profile: Profile
  otsTaller: number
  otsTerritorio: number
  presentes: number
  tardanzas: number
  puntosOT: number
  puntosAsistencia: number
  total: number
}

/**
 * Calcula el ranking (o el desglose de un solo alumno) para el conjunto
 * de perfiles dado. `profiles` tiene que ser el universo completo de
 * gente que pudo haber contribuido a las OT que se están contando (ver
 * nota en puntosPorAlumnoDesdeOTs) -- para ver el desglose de un solo
 * alumno sin desvirtuar el cálculo, pasá su grupo entero acá y después
 * filtrá el resultado al id que te interesa.
 */
export function buildRanking(
  profiles: Profile[],
  finishedOrders: FinishedOrder[],
  events: WorkOrderEvent[],
  attendance: Attendance[],
): RankingEntry[] {
  const alumnoIds = new Set(profiles.map((p) => p.id))
  const puntosOtPorAlumno = puntosPorAlumnoDesdeOTs(finishedOrders, events, alumnoIds)

  // Conteos "OT taller/territorio" mostrados en la card: cuántas OT
  // finalizadas tuvieron a este alumno en al menos un paso -- ya no es
  // "de las que soy responsable final", sino "en las que participé".
  const otsPorAlumnoPorTipo = new Map<string, { taller: Set<string>; territorio: Set<string> }>()
  const otById = new Map(finishedOrders.map((o) => [o.id, o]))
  for (const e of events) {
    if (!e.profile_id || !alumnoIds.has(e.profile_id)) continue
    if (!WORK_ORDER_PASOS_BLOQUEANTES.includes(e.clave)) continue
    const ot = otById.get(e.work_order_id)
    if (!ot) continue
    if (!otsPorAlumnoPorTipo.has(e.profile_id)) {
      otsPorAlumnoPorTipo.set(e.profile_id, { taller: new Set(), territorio: new Set() })
    }
    otsPorAlumnoPorTipo.get(e.profile_id)![ot.tipo === 'taller' ? 'taller' : 'territorio'].add(
      ot.id,
    )
  }

  return profiles
    .map((p) => {
      const otsTaller = otsPorAlumnoPorTipo.get(p.id)?.taller.size ?? 0
      const otsTerritorio = otsPorAlumnoPorTipo.get(p.id)?.territorio.size ?? 0
      const asistencias = attendance.filter((a) => a.student_id === p.id)
      const presentes = asistencias.filter((a) => a.estado === 'Presente').length
      const tardanzas = asistencias.filter((a) => a.estado === 'Tardanza').length

      const puntosOT = Math.round((puntosOtPorAlumno.get(p.id) ?? 0) * 10) / 10
      const puntosAsistencia =
        presentes * RANKING_PUNTOS.presente + tardanzas * RANKING_PUNTOS.tardanza
      const total = Math.round((puntosOT + puntosAsistencia) * 10) / 10

      return {
        profile: p,
        otsTaller,
        otsTerritorio,
        presentes,
        tardanzas,
        puntosOT,
        puntosAsistencia,
        total,
      }
    })
    .sort((a, b) => b.total - a.total)
}

export function attendanceByKeyFrom(attendance: Attendance[]): Map<string, Attendance['estado']> {
  const map = new Map<string, Attendance['estado']>()
  for (const a of attendance) map.set(`${a.student_id}:${a.session_id}`, a.estado)
  return map
}

/** Presentes/tardanzas/ausentes/horas/% de asistencia de un alumno, a
 * partir de las sesiones de su grupo y el mapa `attendanceByKeyFrom`. */
export function attendanceStatsFor(
  studentId: string,
  sessions: Session[],
  attendanceByKey: Map<string, Attendance['estado']>,
) {
  let presentes = 0
  let tardanzas = 0
  let ausentes = 0
  let horas = 0
  for (const s of sessions) {
    const estado = attendanceByKey.get(`${studentId}:${s.id}`)
    if (estado === 'Presente') {
      presentes++
      horas += s.horas
    } else if (estado === 'Tardanza') {
      tardanzas++
      horas += s.horas
    } else if (estado === 'Ausente') {
      ausentes++
    }
  }
  const totalMarcado = presentes + tardanzas + ausentes
  const porcentaje =
    totalMarcado > 0 ? Math.round(((presentes + tardanzas) / totalMarcado) * 100) : 0
  return { presentes, tardanzas, ausentes, horas, porcentaje, totalMarcado }
}
