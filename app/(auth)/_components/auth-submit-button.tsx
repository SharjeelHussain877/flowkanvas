import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const authPrimaryButtonClassName =
  "h-11 bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90"

export interface AuthSubmitButtonProps {
  pending: boolean
  label: string
  icon?: React.ReactNode
  className?: string
}

export function AuthSubmitButton({
  pending,
  label,
  icon,
  className,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(authPrimaryButtonClassName, "w-full", className)}
    >
      {label}
      {pending ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : (
        icon
      )}
    </Button>
  )
}
