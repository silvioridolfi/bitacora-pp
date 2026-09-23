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

// Los nombres de hoja de Excel no pueden pasar 31 caracteres ni contener
// \ / ? * [ ] : -- y tienen que ser únicos dentro del libro (dos alumnos
// con el mismo apellido y nombre, aunque sea raro, no pueden chocar).
function sheetNameFor(apellidoNombre: string, used: Set<string>): string {
  const base = apellidoNombre.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Alumno'
  let name = base
  let i = 2
  while (used.has(name)) {
    const suffix = ` (${i})`
    name = base.slice(0, 31 - suffix.length) + suffix
    i++
  }
  used.add(name)
  return name
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

  // -- Hoja "Resumen": un vistazo rápido de todo el grupo (solo tiene
  // sentido cuando hay más de un alumno en el informe).
  if (students.length > 1) {
    const summarySheet = workbook.addWorksheet('Resumen')
    summarySheet.addRow([titulo]).font = { name: 'Encode Sans', bold: true, size: 14 }
    summarySheet.addRow([`Generado el ${formatDate(new Date().toISOString().slice(0, 10))}`]).font = {
      name: 'Encode Sans',
      italic: true,
      color: { argb: 'FF666666' },
    }
    summarySheet.addRow([])

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
  }

  // -- Una hoja por alumno, con su propio historial de sesiones (de la
  // más nueva a la más vieja) -- así el seguimiento de cada uno queda
  // autocontenido y no se corta por tener que compartir una sola hoja
  // ancha con el resto del grupo.
  const usedSheetNames = new Set<string>()
  for (const student of students) {
    const stats = statsFor(student.id)
    const sheet = workbook.addWorksheet(sheetNameFor(student.apellido_nombre, usedSheetNames), {
      views: [{ state: 'frozen', ySplit: 7 }],
    })

    sheet.addRow([student.apellido_nombre]).font = { name: 'Encode Sans', bold: true, size: 14 }
    sheet.addRow([titulo]).font = {
      name: 'Encode Sans',
      italic: true,
      color: { argb: 'FF666666' },
    }
    sheet.addRow([])

    const totalRow = sheet.addRow(['Total (horas)', stats.horas])
    totalRow.getCell(1).font = { name: 'Encode Sans', bold: true }
    totalRow.getCell(2).font = { name: 'Encode Sans', bold: true, size: 13 }
    sheet.addRow([
      `${stats.presentes} presentes · ${stats.tardanzas} tardanzas · ${stats.ausentes} ausentes (${stats.porcentaje}% de asistencia)`,
    ]).font = { name: 'Encode Sans', italic: true, color: { argb: 'FF666666' } }
    sheet.addRow([])

    const headerRow = sheet.addRow(['Sesión', 'Fecha', 'Estado'])
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Encode Sans', bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EEF5' } }
      cell.border = THIN_BORDER
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    headerRow.getCell(1).alignment = { horizontal: 'left' }
    headerRow.getCell(2).alignment = { horizontal: 'left' }

    for (const session of sessions) {
      const estado = attendanceByKey.get(`${student.id}:${session.id}`) ?? '—'
      const row = sheet.addRow([`Sesión #${session.sesion_n}`, formatDate(session.fecha), estado])
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Encode Sans' }
        cell.border = THIN_BORDER
        if (colNumber === 3) {
          cell.alignment = { horizontal: 'center' }
          const argb = ESTADO_ARGB[estado]
          if (argb) cell.font = { name: 'Encode Sans', bold: true, color: { argb } }
        }
      })
    }

    sheet.getColumn(1).width = 16
    sheet.getColumn(2).width = 14
    sheet.getColumn(3).width = 16
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
