"use client"

import { useQuery } from "@tanstack/react-query"
import { Workflow } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { queryKeys } from "@/lib/query/keys"
import type {
  RenderRequestRecord,
  RenderRequestsListResponse,
} from "@/schemas/requests/render-request"

type RequestsListProps = {
  initialData: RenderRequestRecord[]
  loadError?: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function RequestsList({ initialData, loadError = null }: RequestsListProps) {
  const requestsQuery = useQuery({
    queryKey: queryKeys.requests.list(),
    queryFn: () => apiClient<RenderRequestsListResponse>("/api/requests"),
    initialData: loadError ? undefined : { data: initialData },
    enabled: !loadError,
    select: (response) => response.data,
    refetchInterval: 15_000,
  })

  const requests = requestsQuery.data ?? initialData

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load requests</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Every generate call is logged here with its template, source and timing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-brand-surface px-4 py-10 text-center">
            <Workflow className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-brand-text-heading">No requests yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a PDF from the API or the tester under{" "}
              <Link
                href={dashboardRoutes.settings.apiKeys}
                className="text-brand-teal underline-offset-4 hover:underline"
              >
                API Keys
              </Link>{" "}
              and it will show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted-foreground">
                  <th className="px-2 py-3 font-medium">When</th>
                  <th className="px-2 py-3 font-medium">Template</th>
                  <th className="px-2 py-3 font-medium">Source</th>
                  <th className="px-2 py-3 font-medium">Status</th>
                  <th className="px-2 py-3 text-right font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-border/40 last:border-0">
                    <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="font-medium text-brand-text-heading">
                        {request.template_id ? (
                          <Link
                            href={dashboardRoutes.template(request.template_id)}
                            className="hover:underline"
                          >
                            {request.template_name}
                          </Link>
                        ) : (
                          request.template_name
                        )}
                      </div>
                      {request.error ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-destructive">
                          {request.error}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant="outline">
                        {request.source === "api" ? "API key" : "Tester"}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={request.status === "success" ? "default" : "destructive"}>
                        {request.status === "success" ? "Success" : "Failed"}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-right text-muted-foreground">
                      {request.duration_ms} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
