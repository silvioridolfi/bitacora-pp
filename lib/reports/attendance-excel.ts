import ExcelJS from 'exceljs'
import { formatDate } from '@/lib/format'
import type { Attendance, Profile, Session } from '@/lib/types'

const ESTADO_ARGB: Record<string, string> = {
  Presente: 'FF1F9D5A',
  Tardanza: 'FFF97316',
  Ausente: 'FFC0392B',
}

const THIN_BORDER = {
  top: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
  bottom: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
  left: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
  right: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
}

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

  function statsFor(studentId: string) {
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
    return { presentes, tardanzas, ausentes, horas, porcentaje }
  }

  // -- Hoja 1: matriz de asistencia (una fila por sesión, una columna por alumno)
  const sheet = workbook.addWorksheet('Asistencia', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4 }],
  })
  sheet.addRow([titulo]).font = { name: 'Encode Sans', bold: true, size: 14 }
  sheet.addRow([`Generado el ${formatDate(new Date().toISOString().slice(0, 10))}`]).font = {
    name: 'Encode Sans',
    italic: true,
    color: { argb: 'FF666666' },
  }
  sheet.addRow([])

  const headerRow = sheet.addRow(['Sesión', 'Fecha', ...students.map((s) => s.apellido_nombre)])
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Encode Sans', bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EEF5' } }
    cell.border = THIN_BORDER
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  headerRow.getCell(1).alignment = { horizontal: 'left' }
  headerRow.getCell(2).alignment = { horizontal: 'left' }

  for (const session of sessions) {
    const row = sheet.addRow([
      `Sesión #${session.sesion_n}`,
      formatDate(session.fecha),
      ...students.map((student) => attendanceByKey.get(`${student.id}:${session.id}`) ?? '—'),
    ])
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Encode Sans' }
      cell.border = THIN_BORDER
      if (colNumber > 2) {
        cell.alignment = { horizontal: 'center' }
        const estado = String(cell.value)
        if (ESTADO_ARGB[estado]) {
          cell.font = { name: 'Encode Sans', bold: true, color: { argb: ESTADO_ARGB[estado] } }
        }
      }
    })
  }

  const totalRow = sheet.addRow([
    'Total (horas)',
    '',
    ...students.map((s) => statsFor(s.id).horas),
  ])
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Encode Sans', bold: true }
    cell.border = THIN_BORDER
    if (colNumber > 2) cell.alignment = { horizontal: 'center' }
  })

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
    '% Asistencia',
    'Horas acreditadas',
  ])
  summaryHeader.eachCell((cell) => {
    cell.font = { name: 'Encode Sans', bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EEF5' } }
    cell.border = THIN_BORDER
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  summaryHeader.getCell(1).alignment = { horizontal: 'left' }

  for (const student of students) {
    const stats = statsFor(student.id)
    const row = summarySheet.addRow([
      student.apellido_nombre,
      stats.presentes,
      stats.tardanzas,
      stats.ausentes,
      `${stats.porcentaje}%`,
      stats.horas,
    ])
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Encode Sans' }
      cell.border = THIN_BORDER
      if (colNumber > 1) cell.alignment = { horizontal: 'center' }
    })
  }

  summarySheet.getColumn(1).width = 28
  for (let i = 2; i <= 6; i++) summarySheet.getColumn(i).width = 16

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
