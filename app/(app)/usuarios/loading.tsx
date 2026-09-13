import { Skeleton } from '@/components/ui/skeleton'

export default function UsuariosLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-none border-b border-border last:border-0" />
        ))}
      </div>
    </div>
  )
}
