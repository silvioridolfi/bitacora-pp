'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Refresca la página (server components) cada vez que cambia algo en
 * work_orders o work_order_events -- así el Kanban, Taller y Territorio
 * se actualizan solos cuando otro alumno mueve/completa algo, sin que
 * nadie tenga que apretar F5. Con un pequeño debounce para no disparar
 * un refresh por cada evento si llegan varios juntos.
 */
export function useRealtimeWorkOrders() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let timeout: ReturnType<typeof setTimeout> | null = null

    function scheduleRefresh() {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => router.refresh(), 400)
    }

    const channel = supabase
      .channel('work-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'bitacora_pp', table: 'work_orders' },
        scheduleRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'bitacora_pp', table: 'work_order_events' },
        scheduleRefresh,
      )
      .subscribe()

    return () => {
      if (timeout) clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [router])
}
