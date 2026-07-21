import { Check } from "lucide-react"

import { getPasswordRequirementStates } from "@/lib/auth/password-requirements"
import { cn } from "@/lib/utils"

export interface PasswordRequirementsProps {
  password: string
  className?: string
}

export function PasswordRequirements({
  password,
  className,
}: PasswordRequirementsProps) {
  const requirements = getPasswordRequirementStates(password)

  return (
    <ul
      className={cn("flex flex-col gap-1.5 pt-1", className)}
      aria-live="polite"
      aria-label="Password requirements"
    >
      {requirements.map(({ id, label, met }) => (
        <li
          key={id}
          className={cn(
            "flex items-center gap-2 text-xs transition-colors duration-200",
            met ? "text-brand-primary" : "text-brand-text-muted"
          )}
        >
          <span
            className={cn(
              "flex size-3.5 shrink-0 items-center justify-center transition-colors duration-200",
              met ? "text-brand-primary" : "text-brand-text-muted"
            )}
            aria-hidden
          >
            {met ? (
              <Check className="size-3.5 stroke-[2.5]" />
            ) : (
              <span className="size-1 rounded-full bg-current" />
            )}
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}
