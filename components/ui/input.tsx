import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  startIcon,
  endIcon,
  onChange,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  readOnly,
  ...props
}: React.ComponentProps<"input"> & {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}) {
  const hasIcons = startIcon || endIcon
  const isEmailInput = type === "email"
  const usesChangeHandler = (isEmailInput || onChange) && !readOnly

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (isEmailInput) {
      event.target.value = event.target.value.toLowerCase()
    }

    onChange?.(event)
  }

  const input = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-brand-input-border bg-brand-input px-3 py-7 text-base text-brand-text-heading transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-brand-text-placeholder focus-visible:border-brand-primary  disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", // focus-visible:ring-3 focus-visible:ring-brand-primary/20 aria-invalid:ring-3 aria-invalid:ring-destructive/20
        startIcon && "ps-10",
        endIcon && "pe-10",
        !hasIcons && "px-3",
        className
      )}
      {...(usesChangeHandler
        ? {
            onChange: handleChange,
          }
        : {})}
      readOnly={readOnly}
      autoCapitalize={isEmailInput ? "none" : autoCapitalize}
      autoCorrect={isEmailInput ? "off" : autoCorrect}
      spellCheck={isEmailInput ? false : spellCheck}
      {...props}
    />
  )

  if (!hasIcons) {
    return input
  }

  return (
    <div data-slot="input-group" className="relative w-full">
      {startIcon && (
        <div
          data-slot="input-start-icon"
          className="pointer-events-none absolute start-3 top-1/2 flex -translate-y-1/2 items-center text-brand-text-muted [&_svg]:size-[18px]"
        >
          {startIcon}
        </div>
      )}
      {input}
      {endIcon && (
        <div
          data-slot="input-end-icon"
          className="absolute end-3 top-1/2 flex -translate-y-1/2 items-center text-brand-text-muted [&_button]:cursor-pointer [&_svg]:size-[18px]"
        >
          {endIcon}
        </div>
      )}
    </div>
  )
}

export { Input }
