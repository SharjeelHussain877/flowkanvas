import { Skeleton } from "@/components/ui/skeleton"

export default function TemplateEditorLoading() {
  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-border/70 bg-card px-4">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-8 w-56" />
        <div className="ms-auto flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-14 border-e border-border/70 bg-card p-2">
          <div className="space-y-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="size-10 rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center bg-brand-mist/60 p-8">
            <Skeleton className="aspect-[1/1.41] h-full max-h-[640px] rounded-sm" />
          </div>
          <div className="flex h-24 items-center gap-2 border-t border-border/70 bg-card px-3">
            <Skeleton className="h-16 w-12 rounded-sm" />
            <Skeleton className="h-16 w-12 rounded-sm" />
          </div>
        </div>
        <div className="hidden w-80 border-s border-border/70 bg-card p-4 lg:block">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
