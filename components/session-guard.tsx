'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const TIMEBOX_MS = 24 * 60 * 60 * 1000 // 24hs desde el login, tenga actividad o no
const INACTIVITY_MS = 8 * 60 * 60 * 1000 // 8hs sin ninguna interacción
const CHECK_INTERVAL_MS = 5 * 60 * 1000 // revisa cada 5 min
const ACTIVITY_KEY = 'rt_last_activity'
const SESSION_START_KEY = 'rt_session_start'

/**
 * Reemplaza el "Time-box user sessions" / "Inactivity timeout" de
 * Supabase Auth (solo disponible en plan Pro) con la misma lógica
 * hecha a mano: 24hs de duración máxima desde el login, o cierre por
 * 8hs sin actividad -- pensado para compus compartidas del taller
 * donde alguien se puede olvidar de cerrar sesión. No reemplaza la
 * restricción real de horario para editar OT (esa corre en el
 * servidor); esto es una capa de higiene adicional para las sesiones
 * que quedan abiertas sin uso.
 *
 * El momento de inicio se guarda en localStorage al detectar el login
 * (evento SIGNED_IN) -- no se puede usar el `iat` del access token,
 * porque Supabase lo refresca solo cada ~1h mientras hay actividad,
 * lo que resetearía el timebox constantemente.
 */
export function SessionGuard({ isAdmin }: { isAdmin: boolean }) {
  const supabase = useRef(createClient())

  useEffect(() => {
    if (isAdmin) return // el FED no tiene este corte, igual que el resto de las restricciones

    function markActivity() {
      localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
    }

    async function checkSession() {
      const { data } = await supabase.current.auth.getSession()
      if (!data.session) return

      if (!localStorage.getItem(SESSION_START_KEY)) {
        localStorage.setItem(SESSION_START_KEY, String(Date.now()))
      }

      const now = Date.now()
      const sessionStart = Number(localStorage.getItem(SESSION_START_KEY)) || now
      const lastActivity = Number(localStorage.getItem(ACTIVITY_KEY)) || now

      const timeboxExpired = now - sessionStart > TIMEBOX_MS
      const inactivityExpired = now - lastActivity > INACTIVITY_MS

      if (timeboxExpired || inactivityExpired) {
        localStorage.removeItem(SESSION_START_KEY)
        localStorage.removeItem(ACTIVITY_KEY)
        await supabase.current.auth.signOut()
        window.location.href = '/auth/login'
      }
    }

    const {
      data: { subscription },
    } = supabase.current.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        localStorage.setItem(SESSION_START_KEY, String(Date.now()))
        markActivity()
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SESSION_START_KEY)
        localStorage.removeItem(ACTIVITY_KEY)
      }
    })

    markActivity()
    const events = ['click', 'keydown', 'mousemove', 'touchstart'] as const
    events.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }))

    const interval = setInterval(checkSession, CHECK_INTERVAL_MS)
    checkSession()

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActivity))
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [isAdmin])

  return null
}
