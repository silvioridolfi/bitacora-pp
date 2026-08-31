'use client'

import { useState, useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { forceLogoutAllStudents } from '@/lib/actions'

export function ForceLogoutButton() {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    startTransition(async () => {
      const result = await forceLogoutAllStudents()
      if (result.ok) {
        toast.success('Se cerró la sesión de todos los alumnos.')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      type="button"
      variant={confirming ? 'destructive' : 'outline'}
      size="sm"
      disabled={pending}
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      className="gap-1.5"
    >
      <LogOut className="size-3.5" />
      {confirming ? '¿Confirmar? Se van a desconectar todos' : 'Cerrar sesión de todos los alumnos'}
    </Button>
  )
}
