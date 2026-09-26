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

/** 404 de última instancia para rutas que no coinciden con nada. */
export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>No se encontró esta página</EmptyTitle>
          <EmptyDescription>El link puede estar roto o vencido.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" render={<Link href="/" />}>
            Ir al inicio
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
