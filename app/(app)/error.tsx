'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

/**
 * Error boundary para toda la sección logueada de la app -- sin esto, un
 * error sin manejar (ej. Supabase caído un instante) rompía a la pantalla
 * de error genérica de Next.js en vez de algo consistente con el resto.
 * El sidebar/header siguen andando (este archivo solo reemplaza el
 * contenido, ver convención de Next.js de app/(app)/error.tsx).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

  return (
    <Empty className="min-h-[50dvh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle />
        </EmptyMedia>
        <EmptyTitle>Algo salió mal</EmptyTitle>
        <EmptyDescription>
          No se pudo cargar esta pantalla. Puede ser un problema de conexión -- probá de
          nuevo, o volvé al dashboard.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            <RotateCw data-icon="inline-start" />
            Reintentar
          </Button>
          <Button type="button" variant="outline" render={<Link href="/dashboard" />}>
            Ir al dashboard
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}
