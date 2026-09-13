'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Cuenta animada desde su valor actual hasta el nuevo `value` (ease-out).
 * Al montar por primera vez arranca en 0; en actualizaciones posteriores
 * (por ejemplo, el contador de una columna del Kanban que sube o baja en
 * vivo) parte del número que ya se estaba mostrando, no siempre de 0 --
 * si no, un cambio de 5 a 6 se vería como 'contar desde cero hasta 6'.
 */
export function AnimatedNumber({
  value,
  duration = 1400,
  suffix = '',
  decimals = 0,
}: {
  value: number
  duration?: number
  suffix?: string
  decimals?: number
}) {
  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      displayRef.current = value
      return
    }

    const from = displayRef.current
    const delta = value - from
    startRef.current = null
    let frame: number

    function step(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const next = from + delta * eased
      displayRef.current = next
      setDisplay(next)
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
