import Link from 'next/link'
import { SearchX } from 'lucide-react'
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
 * Se muestra cuando notFound() se llama desde una página de la app (ej.
 * un alumno o equipo que no existe) o cuando la URL no coincide con
 * ninguna ruta -- antes caía a la 404 genérica de Next.js, en inglés y
 * sin volver a llevar a ningún lado.
 */
export default function AppNotFound() {
  return (
    <Empty className="min-h-[50dvh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No se encontró esta página</EmptyTitle>
        <EmptyDescription>
          El link puede estar roto, o lo que buscabas ya no existe.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" render={<Link href="/dashboard" />}>
          Ir al dashboard
        </Button>
      </EmptyContent>
    </Empty>
  )
}
