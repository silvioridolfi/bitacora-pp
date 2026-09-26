import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clase base para los <select> nativos de la app (no el componente
 * shadcn, sino los <select> HTML planos). Antes estaba duplicada en 6
 * componentes distintos, con riesgo de que quedaran desincronizados
 * -- por ejemplo el fix de contraste en modo oscuro solo se hubiera
 * aplicado donde alguien se acordara de copiarlo.
 */
export const nativeSelectClass =
  'h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
