'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PartyPopper } from 'lucide-react'
import { todayInArgentina } from '@/lib/timezone'

const COLORS = ['#f43f91', '#705ccb', '#02afc9', '#ebb715', '#1f9d5a']

/** El efecto en sí -- reutilizado tanto por la celebración automática
 * como por el botón de prueba para admin. Antes disparaba una
 * explosión nueva en CADA frame durante ~2s (hasta ~120 disparos de
 * 60 partículas, miles de partículas simultáneas) -- muy pesado en
 * hardware viejo, se notaba clarísimo cómo se iba frenando a medida
 * que caían. Ahora son 6 disparos discretos y espaciados en el
 * tiempo, con menos partículas cada uno y una vida más corta
 * (`ticks`), así que nunca hay tantas partículas juntas en pantalla. */
function dispararFuegosArtificiales() {
  const disparos = [
    { originX: 0.15, delay: 0 },
    { originX: 0.35, delay: 150 },
    { originX: 0.55, delay: 300 },
    { originX: 0.75, delay: 450 },
    { originX: 0.9, delay: 600 },
    { originX: 0.5, delay: 800 },
  ]

  for (const { originX, delay } of disparos) {
    setTimeout(() => {
      confetti({
        particleCount: 35,
        spread: 65,
        startVelocity: 40,
        ticks: 150,
        origin: { x: originX, y: 0.55 },
        colors: COLORS,
      })
    }, delay)
  }

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
