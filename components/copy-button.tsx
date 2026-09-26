'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Botón para copiar un código/N° de serie largo al portapapeles -- pensado
 * para no tener que transcribirlos a mano en el celu. Usa el tamaño
 * "icon-sm" del sistema de diseño, así el área táctil es la misma que el
 * resto de los botones chicos de ícono.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string
  /** Para el aria-label y el toast, ej. "código de la OT". */
  label: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copiado`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('No se pudo copiar. Mantené presionado el texto para copiarlo a mano.')
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label={`Copiar ${label}`}
      title={`Copiar ${label}`}
      className={cn('shrink-0 text-muted-foreground', className)}
    >
      {copied ? (
        <Check className="size-3.5 text-status-finalizada" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  )
}
