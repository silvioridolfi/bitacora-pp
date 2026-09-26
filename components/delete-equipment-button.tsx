'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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

  function handleConfirm() {
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

  const otsWarning =
    workOrderCount > 0
      ? ` Se van a borrar también sus ${workOrderCount} OT${workOrderCount === 1 ? '' : 's'} vinculadas, con todo su historial.`
      : ''

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-3.5" />
        Borrar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar el equipo {numeroSerie}?</AlertDialogTitle>
          <AlertDialogDescription>
            {otsWarning || ' '} Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            Borrar equipo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
