'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteEquipment } from '@/lib/actions'

export function DeleteEquipmentButton({
  equipmentId,
  numeroSerie,
  workOrderCount,
}: {
  equipmentId: string
  numeroSerie: string
  workOrderCount: number
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    const otsWarning =
      workOrderCount > 0
        ? ` Se van a borrar también sus ${workOrderCount} OT${workOrderCount === 1 ? '' : 's'} vinculadas, con todo su historial.`
        : ''
    if (
      !confirm(
        `¿Borrar el equipo ${numeroSerie}?${otsWarning} Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await deleteEquipment(equipmentId)
      if (result.ok) {
        toast.success('Equipo borrado.')
        router.push('/equipos')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleClick}
      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-3.5" />
      Borrar equipo
    </Button>
  )
}
