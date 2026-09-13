'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import type {
  AuditoriaAlumno,
  AuditoriaAsistencia,
  AuditoriaOT,
} from '@/app/(app)/auditoria/page'

function TablaOTs({ ots }: { ots: AuditoriaOT[] }) {
  if (ots.length === 0) {
    return <p className="text-sm text-muted-foreground">No participó en ninguna OT finalizada.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Código</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tipo</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Compañeros que la compartieron
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              Puntos de la OT
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              Pasos hizo / total
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              Le tocaron a él/ella
            </th>
          </tr>
        </thead>
        <tbody>
          {ots.map((ot) => (
            <tr key={ot.codigo} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-medium text-foreground">{ot.codigo}</td>
              <td className="px-3 py-2 capitalize text-muted-foreground">{ot.tipo}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {ot.companeros.length > 0 ? ot.companeros.join(', ') : 'Nadie más (solo él/ella)'}
              </td>
              <td className="px-3 py-2 text-right text-muted-foreground">{ot.puntosOt}</td>
              <td className="px-3 py-2 text-right text-muted-foreground">
                {ot.misPasos} / {ot.totalPasosOt}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-foreground">
                {ot.puntosAsignados} pts
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TablaPasos({ ots }: { ots: AuditoriaOT[] }) {
  const filas = ots.flatMap((ot) => ot.pasos.map((p) => ({ ...p, codigo: ot.codigo })))
  if (filas.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin pasos registrados.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">OT</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Paso</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Completado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-medium text-foreground">{f.codigo}</td>
              <td className="px-3 py-2 text-muted-foreground">{f.label}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {new Date(f.fecha).toLocaleString('es-AR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TablaAsistencia({ asistencias }: { asistencias: AuditoriaAsistencia[] }) {
  if (asistencias.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin asistencia registrada.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Sesión</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fecha</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {asistencias.map((a) => (
            <tr key={a.sesionN} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-medium text-foreground">#{a.sesionN}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(a.fecha)}</td>
              <td className="px-3 py-2 text-muted-foreground">{a.estado}</td>
              <td className="px-3 py-2 text-right font-semibold text-foreground">{a.puntos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AuditoriaViewer({ auditoria }: { auditoria: AuditoriaAlumno[] }) {
  const [selectedId, setSelectedId] = useState(auditoria[0]?.profile.id ?? '')
  const alumno = auditoria.find((a) => a.profile.id === selectedId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {auditoria.map((a, idx) => (
          <button
            key={a.profile.id}
            type="button"
            onClick={() => setSelectedId(a.profile.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedId === a.profile.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            #{idx + 1} {a.profile.apellido_nombre} · {a.total}pts
          </button>
        ))}
      </div>

      {alumno && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Puntos por OT</p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {alumno.puntosOT}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Puntos por asistencia</p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {alumno.puntosAsistencia}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-heading text-lg font-bold text-primary">{alumno.total}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              OT (resumen) -- {alumno.ots.length} en total
            </h2>
            <TablaOTs ots={alumno.ots} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              Pasos completados (detalle)
            </h2>
            <TablaPasos ots={alumno.ots} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Asistencia</h2>
            <TablaAsistencia asistencias={alumno.asistencias} />
          </div>
        </div>
      )}
    </div>
  )
}
