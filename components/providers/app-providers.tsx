"use client"

import { useIsMutating } from "@tanstack/react-query"

import { GlobalSpinner } from "@/components/feedback/global-spinner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "@/components/providers/query-provider"
import type { AppMutationMeta } from "@/lib/query/mutation-meta"

function MutationSpinner() {
  const pendingMutations = useIsMutating({
    predicate: (mutation) => {
      const meta = mutation.options.meta as AppMutationMeta | undefined
      return meta?.background !== true
    },
  })

  if (pendingMutations === 0) {
    return null
  }

  return <GlobalSpinner />
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <QueryProvider>
        <MutationSpinner />
        {children}
      </QueryProvider>
    </TooltipProvider>
  )
}
