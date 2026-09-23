'use client'

import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Texto explicativo largo debajo de un <h1> (reglas de cálculo, cómo
 * usar la pantalla, etc.) -- en mobile ocupaba toda la pantalla antes
 * de llegar al contenido real. Acá queda colapsado detrás de un toggle
 * en mobile, y siempre visible como antes a partir de sm: (ahí sobra
 * espacio de sobra).
 */
export function PageHint({
  children,
  label = '¿Cómo funciona?',
}: {
  children: React.ReactNode
  label?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <Info className="size-3.5 shrink-0" />
          <span>{open ? 'Ocultar' : label}</span>
          <ChevronDown className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>
        {open && <p className="mt-1 text-sm text-muted-foreground">{children}</p>}
      </div>
      <p className="hidden text-sm text-muted-foreground sm:block">{children}</p>
    </>
  )
}
