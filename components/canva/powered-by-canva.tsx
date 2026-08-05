import { CanvaIcon } from "@/components/canva/canva-icon"
import { cn } from "@/lib/utils"

type PoweredByCanvaProps = {
  className?: string
}

/** Brand guideline entry-point mark — logo + “Powered by Canva”. */
export function PoweredByCanva({ className }: PoweredByCanvaProps) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase",
        className
      )}
    >
      <CanvaIcon size={16} />
      <span>Powered by Canva</span>
    </p>
  )
}
