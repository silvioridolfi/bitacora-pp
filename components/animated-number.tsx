'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Cuenta animada desde 0 hasta `value` al montar (ease-out, ~700ms).
 * Puramente cosmético -- el valor real ya vino calculado del servidor,
 * esto solo anima cómo se revela.
 */
export function AnimatedNumber({
  value,
  duration = 700,
  suffix = '',
}: {
  value: number
  duration?: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    // Si el usuario prefiere menos movimiento, mostrar el valor final directo.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }

    startRef.current = null
    let frame: number

    function step(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(eased * value))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return (
    <span>
      {display}
      {suffix}
    </span>
  )
}
