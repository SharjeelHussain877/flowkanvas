import { Skeleton } from "@/components/ui/skeleton"

const DEFAULT_SKELETON_COUNT = 10

type TemplatesGridSkeletonProps = {
  count?: number
}

export function TemplatesGridSkeleton({
  count = DEFAULT_SKELETON_COUNT,
}: TemplatesGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="aspect-[3/4] w-full rounded-xl" />
      ))}
    </div>
  )
}
