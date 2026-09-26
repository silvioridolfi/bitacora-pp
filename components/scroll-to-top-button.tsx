'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

/**
 * Botón flotante que aparece tras scrollear un poco, para volver
 * arriba de un salto en vez de tener que arrastrar el dedo muchas
 * veces en listas largas (mobile sobre todo).
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      className="fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-50 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90 animate-in fade-in zoom-in-75 duration-200"
    >
      <ArrowUp className="size-5" />
    </button>
  )
}
