'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PartyPopper } from 'lucide-react'
import { todayInArgentina } from '@/lib/timezone'

const COLORS = ['#f43f91', '#705ccb', '#02afc9', '#ebb715', '#1f9d5a']

/** El efecto en sí -- reutilizado tanto por la celebración automática
 * como por el botón de prueba para admin. */
function dispararFuegosArtificiales() {
  const duration = 2200
  const end = Date.now() + duration

  function disparo(originX: number) {
    confetti({
      particleCount: 60,
      spread: 70,
      startVelocity: 45,
      origin: { x: originX, y: 0.55 },
      colors: COLORS,
      scalar: 1.1,
    })
  }

  disparo(0.2)
  const frame = () => {
    disparo(Math.random() * 0.6 + 0.2)
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  setTimeout(frame, 250)

  toast.success('¡Estás primero en el ranking! 🏆', {
    description: 'Seguí así, gran trabajo.',
    duration: 4000,
  })
}

/**
 * Fuegos artificiales para quien está mirando su propio primer puesto
 * en el ranking -- se dispara solo para el alumno logueado (nunca para
 * quien mire el puesto de otro), y una sola vez por día (localStorage),
 * para no repetirse cada vez que entra a la página en la misma jornada.
 */
export function RankingCelebration({ esGanador }: { esGanador: boolean }) {
  useEffect(() => {
    if (!esGanador) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const storageKey = 'ranking-celebracion-vista'
    const hoy = todayInArgentina()
    if (localStorage.getItem(storageKey) === hoy) return
    localStorage.setItem(storageKey, hoy)

    dispararFuegosArtificiales()
  }, [esGanador])

  return null
}

/**
 * Botón visible solo para admin -- dispara el mismo efecto bajo
 * demanda, sin depender de ser (ni de loguearse como) el alumno que
 * está primero. Solo sirve para verificar que la animación se ve
 * bien; no toca el localStorage de la celebración automática.
 */
export function ProbarCelebracionButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => dispararFuegosArtificiales()}
    >
      <PartyPopper className="size-4" data-icon="inline-start" />
      Probar animación
    </Button>
  )
}
