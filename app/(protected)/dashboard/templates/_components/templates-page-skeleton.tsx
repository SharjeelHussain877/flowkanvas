import { Skeleton } from "@/components/ui/skeleton"

import { TemplatesGridSkeleton } from "@/app/(protected)/dashboard/templates/_components/templates-grid-skeleton"

export function TemplatesPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <TemplatesGridSkeleton />
    </div>
  )
}
