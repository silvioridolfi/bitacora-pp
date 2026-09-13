'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { todayInArgentina } from '@/lib/timezone'

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

    const duration = 2200
    const end = Date.now() + duration
    const colors = ['#f43f91', '#705ccb', '#02afc9', '#ebb715', '#1f9d5a']

    function disparo(originX: number) {
      confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 45,
        origin: { x: originX, y: 0.55 },
        colors,
        scalar: 1.1,
      })
    }

    disparo(0.2)
    const frame = () => {
      disparo(Math.random() * 0.6 + 0.2)
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    const t1 = setTimeout(frame, 250)

    toast.success('¡Estás primero en el ranking! 🏆', {
      description: 'Seguí así, gran trabajo.',
      duration: 4000,
    })

    return () => clearTimeout(t1)
  }, [esGanador])

  return null
}
