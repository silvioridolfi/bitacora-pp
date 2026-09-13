'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Barra que crece de 0% al porcentaje real al montar. El valor real ya
 * viene calculado del servidor -- esto solo anima cómo se revela.
 */
export function AnimatedProgressBar({
  percent,
  colorClass = 'bg-primary',
  className,
}: {
  percent: number
  colorClass?: string
  className?: string
}) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setWidth(percent)
      return
    }
    // Un frame en 0 antes de animar, para que la transición CSS se dispare.
    const raf = requestAnimationFrame(() => setWidth(percent))
    return () => cancelAnimationFrame(raf)
  }, [percent])

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', colorClass)}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
