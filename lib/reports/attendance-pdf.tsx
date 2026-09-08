import path from 'path'
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { formatDate } from '@/lib/format'
import type { Attendance, Profile, Session } from '@/lib/types'

const HEADER_LOGO_PATH = path.join(
  process.cwd(),
  'public/images/informes/header-practicas-profesionalizantes.png',
)
const FOOTER_LOGO_PATH = path.join(process.cwd(), 'public/images/informes/footer-pba.png')

const styles = StyleSheet.create({
  page: { paddingTop: 76, paddingBottom: 56, paddingHorizontal: 32, fontSize: 10, fontFamily: 'Helvetica' },
  headerFixed: {
    position: 'absolute',
    top: 20,
    left: 32,
    right: 32,
  },
  headerLogo: { width: 260 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1a3a5c' },
  subtitle: { fontSize: 9, color: '#666666', marginBottom: 16 },
  studentHeading: { fontSize: 12, fontWeight: 700, marginTop: 18, marginBottom: 6 },
  table: { display: 'flex', flexDirection: 'column', marginBottom: 8 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e5eef5',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
  },
  cellSesion: { width: '20%', fontWeight: 700 },
  cellFecha: { width: '30%' },
  cellEstado: { width: '30%' },
  headerCell: { fontWeight: 700 },
  footerFixed: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogo: { width: 170 },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 32,
    fontSize: 8,
    color: '#999999',
  },
})

function horasAcreditadas(
  studentId: string,
  sessions: Session[],
  attendanceByKey: Map<string, Attendance['estado']>,
) {
  return sessions.reduce((acc, s) => {
    const estado = attendanceByKey.get(`${studentId}:${s.id}`)
    return estado === 'Presente' || estado === 'Tardanza' ? acc + s.horas : acc
  }, 0)
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

        {students.map((student) => {
          const horas = horasAcreditadas(student.id, sessions, attendanceByKey)
          return (
            <View key={student.id} wrap={false}>
              <Text style={styles.studentHeading}>
                {student.apellido_nombre} -- {horas}hs acreditadas
              </Text>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.cellSesion, styles.headerCell]}>Sesión</Text>
                  <Text style={[styles.cellFecha, styles.headerCell]}>Fecha</Text>
                  <Text style={[styles.cellEstado, styles.headerCell]}>Estado</Text>
                </View>
                {sessions.map((session) => {
                  const estado = attendanceByKey.get(`${student.id}:${session.id}`) ?? '—'
                  return (
                    <View key={session.id} style={styles.tableRow}>
                      <Text style={styles.cellSesion}>#{session.sesion_n}</Text>
                      <Text style={styles.cellFecha}>{formatDate(session.fecha)}</Text>
                      <Text style={styles.cellEstado}>{estado}</Text>
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
