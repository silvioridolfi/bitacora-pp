import { Skeleton } from '@/components/ui/skeleton'

export default function TableroLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-card/50 p-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 2 }).map((_, j) => (
              <Skeleton key={j} className="h-20 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
