import path from 'path'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import { formatDate } from '@/lib/format'
import type { Attendance, Profile, Session } from '@/lib/types'

const HEADER_LOGO_PATH = path.join(
  process.cwd(),
  'public/images/informes/header-practicas-profesionalizantes.png',
)
const FOOTER_LOGO_PATH = path.join(process.cwd(), 'public/images/informes/footer-pba.png')

// Tipografía institucional -- la misma que usa el resto de la app
// (app/layout.tsx la carga vía next/font/google, que no deja archivos
// sueltos reusables, así que acá se registran directo los .ttf).
Font.register({
  family: 'Encode Sans',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/EncodeSans-Regular.ttf'), fontWeight: 400 },
    { src: path.join(process.cwd(), 'public/fonts/EncodeSans-SemiBold.ttf'), fontWeight: 600 },
    { src: path.join(process.cwd(), 'public/fonts/EncodeSans-Bold.ttf'), fontWeight: 700 },
  ],
})

const ESTADO_COLOR: Record<string, string> = {
  Presente: '#1f9d5a',
  Tardanza: '#f97316',
  Ausente: '#c0392b',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 76,
    paddingBottom: 56,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: 'Encode Sans',
  },
  headerFixed: {
    position: 'absolute',
    top: 20,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  headerLogo: { width: 260 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1a3a5c' },
  subtitle: { fontSize: 9, color: '#666666', marginBottom: 14 },
  sectionHeading: { fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#1a3a5c' },
  studentHeading: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 1 },
  studentSubheading: { fontSize: 8.5, color: '#666666', marginBottom: 5 },
  table: { display: 'flex', flexDirection: 'column', marginBottom: 4 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e5eef5',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
  },
  cellSesion: { width: '18%', fontWeight: 700 },
  cellFecha: { width: '27%' },
  cellEstado: { width: '25%', fontWeight: 700 },
  headerCell: { fontWeight: 700 },
  summaryTable: { display: 'flex', flexDirection: 'column', marginBottom: 18 },
  summaryHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e5eef5',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
  },
  summaryCellAlumno: { width: '32%', fontWeight: 700 },
  summaryCell: { width: '17%', textAlign: 'center' },
  footerFixed: {
    position: 'absolute',
    bottom: 14,
    left: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogo: { width: 260 },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 32,
    fontSize: 8,
    color: '#999999',
  },
})

function computeStats(
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
  const porcentaje = totalMarcado > 0 ? Math.round(((presentes + tardanzas) / totalMarcado) * 100) : 0
  return { presentes, tardanzas, ausentes, horas, porcentaje, totalMarcado }
}

function AttendanceDocument({
  students,
  sessions,
  attendance,
  titulo,
}: {
  students: Profile[]
  sessions: Session[]
  attendance: Attendance[]
  titulo: string
}) {
  const attendanceByKey = new Map<string, Attendance['estado']>()
  for (const a of attendance) attendanceByKey.set(`${a.student_id}:${a.session_id}`, a.estado)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerFixed} fixed>
          <Image src={HEADER_LOGO_PATH} style={styles.headerLogo} />
        </View>

        <Text style={styles.title}>{titulo}</Text>
        <Text style={styles.subtitle}>
          Generado el {formatDate(new Date().toISOString().slice(0, 10))} · Registro Técnico,
          DTE Región 1
        </Text>

        {students.length > 1 && (
          <View wrap={false}>
            <Text style={styles.sectionHeading}>Resumen</Text>
            <View style={styles.summaryTable}>
              <View style={styles.summaryHeaderRow}>
                <Text style={[styles.summaryCellAlumno, styles.headerCell]}>Alumno</Text>
                <Text style={[styles.summaryCell, styles.headerCell]}>Presentes</Text>
                <Text style={[styles.summaryCell, styles.headerCell]}>Tardanzas</Text>
                <Text style={[styles.summaryCell, styles.headerCell]}>Ausentes</Text>
                <Text style={[styles.summaryCell, styles.headerCell]}>% Asist.</Text>
              </View>
              {students.map((student) => {
                const stats = computeStats(student.id, sessions, attendanceByKey)
                return (
                  <View key={student.id} style={styles.summaryRow}>
                    <Text style={styles.summaryCellAlumno}>{student.apellido_nombre}</Text>
                    <Text style={styles.summaryCell}>{stats.presentes}</Text>
                    <Text style={styles.summaryCell}>{stats.tardanzas}</Text>
                    <Text style={styles.summaryCell}>{stats.ausentes}</Text>
                    <Text style={styles.summaryCell}>{stats.porcentaje}%</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {students.map((student) => {
          const stats = computeStats(student.id, sessions, attendanceByKey)
          return (
            <View key={student.id}>
              <View wrap={false}>
                <Text style={styles.studentHeading}>{student.apellido_nombre}</Text>
                <Text style={styles.studentSubheading}>
                  {stats.horas}hs acreditadas · {stats.presentes + stats.tardanzas}/
                  {stats.totalMarcado} presentes ({stats.porcentaje}%)
                </Text>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.cellSesion, styles.headerCell]}>Sesión</Text>
                  <Text style={[styles.cellFecha, styles.headerCell]}>Fecha</Text>
                  <Text style={[styles.cellEstado, styles.headerCell]}>Estado</Text>
                </View>
              </View>
              <View style={styles.table}>
                {sessions.map((session) => {
                  const estado = attendanceByKey.get(`${student.id}:${session.id}`) ?? null
                  return (
                    <View key={session.id} style={styles.tableRow} wrap={false}>
                      <Text style={styles.cellSesion}>#{session.sesion_n}</Text>
                      <Text style={styles.cellFecha}>{formatDate(session.fecha)}</Text>
                      <Text
                        style={[
                          styles.cellEstado,
                          { color: estado ? ESTADO_COLOR[estado] : '#999999' },
                        ]}
                      >
                        {estado ?? '—'}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}

        <View style={styles.footerFixed} fixed>
          <Image src={FOOTER_LOGO_PATH} style={styles.footerLogo} />
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

export async function buildAttendancePdf(props: {
  students: Profile[]
  sessions: Session[]
  attendance: Attendance[]
  titulo: string
}): Promise<Buffer> {
  const buffer = await renderToBuffer(<AttendanceDocument {...props} />)
  return buffer
}
