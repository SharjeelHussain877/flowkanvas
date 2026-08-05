"use client"

import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"

import { getDashboardBackNavigation } from "@/lib/dashboard/back-navigation"
import { cn } from "@/lib/utils"

type DashboardPageProps = {
  title: string
  description?: string
  action?: ReactNode
  backHref?: string
  children: ReactNode
  className?: string
}

export function DashboardPage({
  title,
  description,
  action,
  backHref,
  children,
  className,
}: DashboardPageProps) {
  const pathname = usePathname()
  const router = useRouter()
  const back =
    backHref !== undefined
      ? { href: backHref, label: "previous page" }
      : getDashboardBackNavigation(pathname)

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }

    if (back?.href) {
      router.push(back.href)
    }
  }

  return (
    <div className={cn("flex flex-1 flex-col p-6 md:p-8", className)}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-3">
            {back ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label={`Back to ${back.label}`}
                className="inline-flex shrink-0 items-center justify-center rounded-md text-brand-text-muted transition-colors hover:text-brand-text-heading"
              >
                <ArrowLeft className="size-5" aria-hidden />
              </button>
            ) : null}
            <h1 className="font-serif text-2xl font-normal tracking-tight text-brand-text-heading">
              {title}
            </h1>
          </div>
          {description ? (
            <p className="text-sm text-brand-text-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
