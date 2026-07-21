import type { ReactNode } from "react"
import Link from "next/link"

import { BrandLogo } from "@/components/brand-logo"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen font-sans text-foreground bg-linear-to-br from-brand-background-gradient-start via-brand-background to-brand-background-gradient-end [&_[data-slot=card-title]]:font-serif [&_[data-slot=card-title]]:font-normal [&_[data-slot=card-title]]:tracking-tight">
      <header className="flex justify-center px-4 pt-10 pb-10">
        <Link
          href="/"
          className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="flowkanvas home"
        >
          <BrandLogo priority className="mx-auto h-16 max-w-[18rem] object-center" />
          <p className="max-w-xs text-center text-xs leading-relaxed text-brand-text-muted">
            Create PDF templates and{" "}
            <span className="font-serif italic text-brand-text-heading/80">
              generate documents via API
            </span>
          </p>
        </Link>
      </header>

      <main className="mt-0 px-4 pb-10">
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </main>
    </div>
  )
}
