import { Skeleton } from "@/components/ui/skeleton"

const TABLE_ROW_COUNT = 4

export function ApiKeysPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="size-5 shrink-0 rounded-md" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-11 w-40 shrink-0 rounded-lg" />
        </div>

        <div className="space-y-3 px-4 pb-4">
          <div className="grid grid-cols-6 gap-3 border-b border-border/70 pb-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>

          {Array.from({ length: TABLE_ROW_COUNT }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-6 gap-3 py-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-full max-w-[12rem]" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="ms-auto h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
