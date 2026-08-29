'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Refresca la página cuando cambia la escuela activa de cualquier
 * grupo -- así, si alguien del grupo la cambia desde su celular, los
 * demás compañeros trabajando en otras compus la ven actualizada
 * solos, sin F5.
 */
export function useRealtimeEscuelaActiva(channelSuffix: string = 'todos') {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let timeout: ReturnType<typeof setTimeout> | null = null

    function scheduleRefresh() {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => router.refresh(), 400)
    }

    const channel = supabase
      .channel(`escuela-activa-realtime-${channelSuffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'bitacora_pp', table: 'escuela_activa' },
        scheduleRefresh,
      )
      .subscribe()

    return () => {
      if (timeout) clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [router, channelSuffix])
}
