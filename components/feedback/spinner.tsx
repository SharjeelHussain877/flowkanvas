import { cn } from "@/lib/utils"

export interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("size-8", className)}
    >
      <span
        aria-hidden
        className="block size-full animate-spin rounded-full border-2 border-brand-primary/20 border-t-brand-primary"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
