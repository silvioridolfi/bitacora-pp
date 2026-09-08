import ExcelJS from 'exceljs'
import { formatDate } from '@/lib/format'
import type { Attendance, Profile, Session } from '@/lib/types'

export async function buildAttendanceExcel({
  students,
  sessions,
  attendance,
  titulo,
}: {
  students: Profile[]
  sessions: Session[]
  attendance: Attendance[]
  titulo: string
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Registro Técnico -- DTE Región 1'
  workbook.created = new Date()

  const attendanceByKey = new Map<string, Attendance['estado']>()
  for (const a of attendance) attendanceByKey.set(`${a.student_id}:${a.session_id}`, a.estado)

  function horasAcreditadas(studentId: string) {
    return sessions.reduce((acc, s) => {
      const estado = attendanceByKey.get(`${studentId}:${s.id}`)
      return estado === 'Presente' || estado === 'Tardanza' ? acc + s.horas : acc
    }, 0)
  }

  // -- Hoja 1: matriz de asistencia (una fila por sesión, una columna por alumno)
  const sheet = workbook.addWorksheet('Asistencia')
  sheet.addRow([titulo])
  sheet.getRow(1).font = { bold: true, size: 14 }
  sheet.addRow([`Generado el ${formatDate(new Date().toISOString().slice(0, 10))}`])
  sheet.getRow(2).font = { italic: true, color: { argb: 'FF666666' } }
  sheet.addRow([])

  const headerRow = sheet.addRow([
    'Sesión',
    'Fecha',
    ...students.map((s) => s.apellido_nombre),
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EEF5' } }
  })

  for (const session of sessions) {
    sheet.addRow([
      `Sesión #${session.sesion_n}`,
      formatDate(session.fecha),
      ...students.map((student) => {
        const estado = attendanceByKey.get(`${student.id}:${session.id}`)
        return estado ?? '—'
      }),
    ])
  }

  const totalRow = sheet.addRow([
    'Total (horas)',
    '',
    ...students.map((s) => horasAcreditadas(s.id)),
  ])
  totalRow.font = { bold: true }

  sheet.getColumn(1).width = 16
  sheet.getColumn(2).width = 14
  students.forEach((_, i) => {
    sheet.getColumn(i + 3).width = 20
  })

  // -- Hoja 2: resumen por alumno
  const summarySheet = workbook.addWorksheet('Resumen por alumno')
  const summaryHeader = summarySheet.addRow([
    'Alumno',
    'Presentes',
    'Tardanzas',
    'Ausentes',
    'Horas acreditadas',
  ])
  summaryHeader.font = { bold: true }
  summaryHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EEF5' } }
  })

  for (const student of students) {
    let presentes = 0
    let tardanzas = 0
    let ausentes = 0
    for (const session of sessions) {
      const estado = attendanceByKey.get(`${student.id}:${session.id}`)
      if (estado === 'Presente') presentes++
      else if (estado === 'Tardanza') tardanzas++
      else if (estado === 'Ausente') ausentes++
    }
    summarySheet.addRow([
      student.apellido_nombre,
      presentes,
      tardanzas,
      ausentes,
      horasAcreditadas(student.id),
    ])
  }

  summarySheet.getColumn(1).width = 28
  for (let i = 2; i <= 5; i++) summarySheet.getColumn(i).width = 16

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
