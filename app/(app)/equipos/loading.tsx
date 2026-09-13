import { Skeleton } from '@/components/ui/skeleton'

export default function EquiposLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-none border-b border-border last:border-0" />
        ))}
      </div>
    </div>
  )
}
