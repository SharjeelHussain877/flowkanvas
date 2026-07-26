import { Skeleton } from "@/components/ui/skeleton"

function SettingsCardSkeleton({
  rows = 3,
  tall = false,
}: {
  rows?: number
  tall?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-32" />
          {tall ? <Skeleton className="h-6 w-20 rounded-full" /> : null}
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="space-y-3 px-4 pb-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            className={index === 0 && tall ? "h-24 w-full rounded-lg" : "h-10 w-full rounded-lg"}
          />
        ))}
      </div>
    </div>
  )
}

export function SettingsPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="grid gap-4">
        <SettingsCardSkeleton tall rows={4} />
        <SettingsCardSkeleton rows={2} />
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-10 w-44 rounded-lg" />
          </div>
          <div className="space-y-3 px-4 pb-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
