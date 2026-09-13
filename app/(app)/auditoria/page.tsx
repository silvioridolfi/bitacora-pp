import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data'
import { fetchAllRows } from '@/lib/supabase/fetch-all'
import { RANKING_PUNTOS } from '@/lib/status'
import { WORK_ORDER_PASOS_BLOQUEANTES, WORK_ORDER_PASO_INFO } from '@/lib/types'
import type {
  Attendance,
  Grupo,
  Profile,
  Session,
  TipoOT,
  WorkOrderEvent,
  WorkOrderPaso,
} from '@/lib/types'
import { AuditoriaViewer } from '@/components/auditoria-viewer'
import { formatDate } from '@/lib/format'

type FinishedOrder = { id: string; codigo: string; tipo: TipoOT; fecha: string | null }

export type AuditoriaPaso = {
  clave: WorkOrderPaso
  label: string
  fecha: string
}

export type AuditoriaOT = {
  codigo: string
  tipo: TipoOT
  fecha: string | null
  companeros: string[]
  misPasos: number
  totalPasosOt: number
  puntosOt: number
  puntosAsignados: number
  pasos: AuditoriaPaso[]
}

export type AuditoriaAsistencia = {
  sesionN: number
  fecha: string
  estado: string
  puntos: number
}

export type AuditoriaAlumno = {
  profile: Profile
  ots: AuditoriaOT[]
  asistencias: AuditoriaAsistencia[]
  puntosOT: number
  puntosAsistencia: number
  total: number
}

function buildAuditoria(
  profiles: Profile[],
  finishedOrders: FinishedOrder[],
  events: WorkOrderEvent[],
  attendance: Attendance[],
  sessions: Session[],
): AuditoriaAlumno[] {
  const alumnoIds = new Set(profiles.map((p) => p.id))
  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const otById = new Map(finishedOrders.map((o) => [o.id, o]))
  const sessionById = new Map(sessions.map((s) => [s.id, s]))

  // Agrupar eventos (de pasos bloqueantes, de alumnos) por OT
  const eventosPorOt = new Map<string, WorkOrderEvent[]>()
  for (const e of events) {
    if (!e.profile_id || !alumnoIds.has(e.profile_id)) continue
    if (!WORK_ORDER_PASOS_BLOQUEANTES.includes(e.clave)) continue
    if (!otById.has(e.work_order_id)) continue
    if (!eventosPorOt.has(e.work_order_id)) eventosPorOt.set(e.work_order_id, [])
    eventosPorOt.get(e.work_order_id)!.push(e)
  }

  const resultado: AuditoriaAlumno[] = []

  for (const alumno of profiles) {
    const ots: AuditoriaOT[] = []

    for (const [otId, eventosDeEsaOt] of eventosPorOt) {
      const misEventos = eventosDeEsaOt.filter((e) => e.profile_id === alumno.id)
      if (misEventos.length === 0) continue

      const ot = otById.get(otId)!
      const participantes = new Set(eventosDeEsaOt.map((e) => e.profile_id!))
      const companeros = [...participantes]
        .filter((id) => id !== alumno.id)
        .map((id) => profileById.get(id)?.apellido_nombre ?? '—')
      const puntosOt = ot.tipo === 'taller' ? RANKING_PUNTOS.taller : RANKING_PUNTOS.territorio
      const totalPasosOt = eventosDeEsaOt.length
      const misPasos = misEventos.length
      const puntosAsignados = Math.round(puntosOt * (misPasos / totalPasosOt) * 10) / 10

      ots.push({
        codigo: ot.codigo,
        tipo: ot.tipo,
        fecha: ot.fecha,
        companeros,
        misPasos,
        totalPasosOt,
        puntosOt,
        puntosAsignados,
        pasos: misEventos
          .sort((a, b) => a.completed_at.localeCompare(b.completed_at))
          .map((e) => ({
            clave: e.clave,
            label: WORK_ORDER_PASO_INFO[e.clave].label,
            fecha: e.completed_at,
          })),
      })
    }
    ots.sort((a, b) => a.codigo.localeCompare(b.codigo))

    const asistenciasDelAlumno = attendance.filter((a) => a.student_id === alumno.id)
    const asistencias: AuditoriaAsistencia[] = asistenciasDelAlumno
      .map((a) => {
        const session = sessionById.get(a.session_id)
        const puntos =
          a.estado === 'Presente'
            ? RANKING_PUNTOS.presente
            : a.estado === 'Tardanza'
              ? RANKING_PUNTOS.tardanza
              : 0
        return {
          sesionN: session?.sesion_n ?? 0,
          fecha: session?.fecha ?? '',
          estado: a.estado,
          puntos,
        }
      })
      .sort((a, b) => a.sesionN - b.sesionN)

    const puntosOT = Math.round(ots.reduce((acc, o) => acc + o.puntosAsignados, 0) * 10) / 10
    const puntosAsistencia = asistencias.reduce((acc, a) => acc + a.puntos, 0)
    const total = Math.round((puntosOT + puntosAsistencia) * 10) / 10

    resultado.push({ profile: alumno, ots, asistencias, puntosOT, puntosAsistencia, total })
  }

  return resultado.sort((a, b) => b.total - a.total)
}

export default async function AuditoriaPage() {
  const { profile: currentProfile } = await getCurrentProfile()
  if (!currentProfile?.is_admin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const [{ data: students }, finishedOrders, workOrderEvents, attendance, { data: sessionsData }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('is_admin', false).order('apellido_nombre'),
      fetchAllRows<FinishedOrder>((from, to) =>
        supabase
          .from('work_orders')
          .select('id, codigo, tipo, fecha')
          .eq('estado', 'Finalizada OK')
          .range(from, to),
      ),
      fetchAllRows<WorkOrderEvent>((from, to) =>
        supabase.from('work_order_events').select('*').range(from, to),
      ),
      fetchAllRows<Attendance>((from, to) =>
        supabase.from('attendance').select('*').range(from, to),
      ),
      supabase.from('sessions').select('*'),
    ])

  const profiles = (students ?? []) as Profile[]
  const sessions = (sessionsData ?? []) as Session[]

  const auditoria = buildAuditoria(profiles, finishedOrders, workOrderEvents, attendance, sessions)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Auditoría de puntos</h1>
        <p className="text-sm text-muted-foreground">
          Desglose completo de cómo se arma el puntaje de cada alumno: por cada OT, cuántos
          pasos hizo cada uno respecto al total de la OT y qué fracción le tocó (proporcional,
          no partes iguales); por cada paso individual completado; y por asistencia. Generado el{' '}
          {formatDate(new Date().toISOString().slice(0, 10))}.
        </p>
      </div>
      <AuditoriaViewer auditoria={auditoria} />
    </div>
  )
}
