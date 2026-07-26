"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { TemplatePreviewCard } from "@/app/(protected)/dashboard/templates/_components/template-preview-card"
import { TemplatesGridSkeleton } from "@/app/(protected)/dashboard/templates/_components/templates-grid-skeleton"
import { useStaggeredReveal } from "@/app/(protected)/dashboard/templates/_components/use-staggered-reveal"
import { ConnectCanvaButton } from "@/components/canva/connect-canva-button"
import { Spinner } from "@/components/feedback/spinner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api/client"
import type { CanvaConnectFlash } from "@/lib/canva/oauth-notice"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { queryKeys } from "@/lib/query/keys"
import type {
  CanvaTemplatesApiResponse,
  CanvaTemplatesPageData,
} from "@/schemas/canva/templates"
import { cn } from "@/lib/utils"

type TemplatesListProps = {
  initialData: CanvaTemplatesPageData
  loadError?: string | null
  connectFlash?: CanvaConnectFlash | null
}

function TemplatesGridLoader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner className="size-5" label="Loading templates" />
        <span>Loading templates from Canva...</span>
      </div>
      <TemplatesGridSkeleton count={8} />
    </div>
  )
}

export function TemplatesList({
  initialData,
  loadError = null,
  connectFlash = null,
}: TemplatesListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState<CanvaConnectFlash | null>(connectFlash)

  const templatesQuery = useQuery({
    queryKey: queryKeys.canva.templates(),
    queryFn: () => apiClient<CanvaTemplatesApiResponse>("/api/canva/templates"),
    initialData: loadError ? undefined : { data: initialData },
    enabled: !loadError,
    select: (response) => response.data,
  })

  useEffect(() => {
    if (!connectFlash) {
      return
    }

    if (connectFlash.type === "success") {
      void queryClient.invalidateQueries({ queryKey: queryKeys.canva.templates() })
    }

    router.replace(dashboardRoutes.templates, { scroll: false })
  }, [connectFlash, queryClient, router])

  const data = templatesQuery.data ?? initialData
  const hasTemplateGrid =
    data.connected && data.items.length > 0 && !loadError

  const isClientLoading =
    !loadError &&
    (templatesQuery.isPending || templatesQuery.isFetching) &&
    !hasTemplateGrid

  const visibleCount = useStaggeredReveal(
    data.items.length,
    hasTemplateGrid && !isClientLoading
  )

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load templates</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isClientLoading) {
    return (
      <div className="space-y-4">
        {notice ? (
          <p
            className={
              notice.type === "success"
                ? "text-sm text-brand-teal"
                : "text-sm text-destructive"
            }
          >
            {notice.message}
          </p>
        ) : null}
        <TemplatesGridLoader />
      </div>
    )
  }

  if (!data.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Canva</CardTitle>
          <CardDescription>
            Authorize flowkanvas to access your Canva designs and brand templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          {notice ? (
            <p
              className={
                notice.type === "success"
                  ? "text-sm text-brand-teal"
                  : "text-sm text-destructive"
              }
            >
              {notice.message}
            </p>
          ) : null}
          <ConnectCanvaButton returnTo={dashboardRoutes.templates} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <p
          className={
            notice.type === "success"
              ? "text-sm text-brand-teal"
              : "text-sm text-destructive"
          }
        >
          {notice.message}
        </p>
      ) : null}

      {data.brandTemplatesError ? (
        <p className="text-sm text-muted-foreground">
          Brand templates could not be loaded: {data.brandTemplatesError}
        </p>
      ) : null}

      {data.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Canva templates yet</CardTitle>
            <CardDescription>
              Create a design or brand template in Canva, then refresh this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="https://www.canva.com/create" target="_blank" rel="noreferrer">
                Open Canva
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {data.items.map((item, index) => {
            const isVisible = index < visibleCount

            if (!isVisible) {
              return (
                <Skeleton
                  key={`${item.kind}-${item.id}-placeholder`}
                  className="aspect-[3/4] w-full rounded-xl"
                />
              )
            }

            return (
              <TemplatePreviewCard
                key={`${item.kind}-${item.id}`}
                item={item}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards"
                )}
              />
            )
          })}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Need to manage the connection?{" "}
        <Link
          href={dashboardRoutes.settings.general}
          className="text-brand-teal underline-offset-4 hover:underline"
        >
          Go to Settings
        </Link>
      </p>
    </div>
  )
}
