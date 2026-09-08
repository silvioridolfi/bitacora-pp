import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data'
import { buildAttendanceExcel } from '@/lib/reports/attendance-excel'
import { buildAttendancePdf } from '@/lib/reports/attendance-pdf'
import type { Attendance, Grupo, Profile, Session } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { profile } = await getCurrentProfile()
  if (!profile) {
    return NextResponse.json({ error: 'No hay sesión activa.' }, { status: 401 })
  }
  if (!profile.is_admin) {
    return NextResponse.json(
      { error: 'Solo el FED puede exportar informes de asistencia.' },
      { status: 403 },
    )
  }

  const { searchParams } = new URL(request.url)
  const formato = searchParams.get('formato') === 'excel' ? 'excel' : 'pdf'
  const grupoParam = searchParams.get('grupo')
  const alumnoId = searchParams.get('alumnoId')

  if (!grupoParam && !alumnoId) {
    return NextResponse.json({ error: 'Falta indicar grupo o alumno.' }, { status: 400 })
  }

  const supabase = await createClient()

  let students: Profile[] = []
  let grupo: Grupo | null = null

  if (alumnoId) {
    const { data: student } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', alumnoId)
      .maybeSingle()
    if (!student) {
      return NextResponse.json({ error: 'Alumno no encontrado.' }, { status: 404 })
    }
    students = [student as Profile]
    grupo = (student as Profile).grupo
  } else {
    grupo = grupoParam as Grupo
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('grupo', grupo)
      .order('apellido_nombre')
    students = (data ?? []) as Profile[]
  }

  if (!grupo) {
    return NextResponse.json({ error: 'No se pudo determinar el grupo.' }, { status: 400 })
  }

  const { data: sessionsData } = await supabase
    .from('sessions')
    .select('*')
    .eq('grupo', grupo)
    .order('sesion_n')
  const sessions = (sessionsData ?? []) as Session[]
  const sessionIds = sessions.map((s) => s.id)

  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('*')
    .in('session_id', sessionIds.length ? sessionIds : ['00000000-0000-0000-0000-000000000000'])
  const attendance = (attendanceData ?? []) as Attendance[]

  const titulo = alumnoId
    ? `Informe de asistencia -- ${students[0]?.apellido_nombre}`
    : `Informe de asistencia -- ${grupo}`

  const filenameBase = alumnoId
    ? `asistencia-${students[0]?.apellido_nombre.replace(/[^a-zA-Z0-9]/g, '_')}`
    : `asistencia-${grupo.replace(/[^a-zA-Z0-9]/g, '_')}`

  if (formato === 'excel') {
    const buffer = await buildAttendanceExcel({ students, sessions, attendance, titulo })
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
      },
    })
  }

  const buffer = await buildAttendancePdf({ students, sessions, attendance, titulo })
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
    },
  })
}
