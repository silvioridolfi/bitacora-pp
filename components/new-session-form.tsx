'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSession } from '@/lib/actions'
import { todayInArgentina } from '@/lib/timezone'
import type { Grupo } from '@/lib/types'

export function NewSessionForm({ grupo }: { grupo: Grupo }) {
  const [newFecha, setNewFecha] = useState(todayInArgentina())
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAddFecha() {
    if (!newFecha) return
    startTransition(async () => {
      const result = await createSession(grupo, newFecha)
      if (result.ok) {
        toast.success('Sesión agregada (4hs)')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="new-fecha">
          Nueva sesión (4hs)
        </label>
        <Input
          id="new-fecha"
          type="date"
          value={newFecha}
          onChange={(e) => setNewFecha(e.target.value)}
          className="h-9 w-40"
        />
      </div>
      <Button type="button" size="sm" disabled={pending} onClick={handleAddFecha}>
        <Plus className="size-4" data-icon="inline-start" />
        Agregar sesión
      </Button>
    </div>
  )
}
