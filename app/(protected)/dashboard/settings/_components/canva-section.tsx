"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Unlink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { settingsOutlineButtonClassName } from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
import { CanvaIcon } from "@/components/canva/canva-icon"
import { ConnectCanvaButton } from "@/components/canva/connect-canva-button"
import { PoweredByCanva } from "@/components/canva/powered-by-canva"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import type { CanvaConnectFlash } from "@/lib/canva/oauth-notice"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import { queryKeys } from "@/lib/query/keys"
import type { CanvaConnectionStatus } from "@/lib/services/canva/connection"
import { cn } from "@/lib/utils"

type CanvaConnectionResponse = {
  data: CanvaConnectionStatus
}

type CanvaSectionProps = {
  initialConnection: CanvaConnectionStatus
  connectFlash?: CanvaConnectFlash | null
}

function formatConnectedAt(value: string | null) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function CanvaSection({
  initialConnection,
  connectFlash = null,
}: CanvaSectionProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState<CanvaConnectFlash | null>(connectFlash)

  const { data: connection } = useQuery({
    queryKey: queryKeys.canva.connection(),
    queryFn: () => apiClient<CanvaConnectionResponse>("/api/settings/canva"),
    initialData: { data: initialConnection },
    select: (response) => response.data,
  })

  useEffect(() => {
    if (!connectFlash) {
      return
    }

    if (connectFlash.type === "success") {
      void queryClient.invalidateQueries({ queryKey: queryKeys.canva.connection() })
    }

    router.replace("/dashboard/settings", { scroll: false })
  }, [connectFlash, queryClient, router])

  const disconnectMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: () =>
      apiClient<{ data: { connected: false } }>("/api/settings/canva", {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.canva.connection() })
      setNotice({ type: "success", message: "Canva disconnected." })
    },
    onError: (error) => {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not disconnect Canva. Try again, or reconnect later from Settings.",
      })
    },
  })

  const connectedAtLabel = formatConnectedAt(connection.connectedAt)

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CanvaIcon size={24} />
              <CardTitle>Canva</CardTitle>
            </div>
            <PoweredByCanva />
          </div>
          <Badge variant={connection.connected ? "default" : "secondary"}>
            {connection.connected ? "Connected" : "Not connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <CardDescription>
              Works with Canva - connect your account to import designs and brand
              templates into flowkanvas.
            </CardDescription>

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

            {connection.connected ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Canva account is connected
                  {connection.displayName
                    ? ` as ${connection.displayName}`
                    : ""}
                  .
                </p>
                {connectedAtLabel ? <p>Connected {connectedAtLabel}</p> : null}
                {connection.canvaUserId ? (
                  <p className="text-xs">Canva user ID: {connection.canvaUserId}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Authorize flowkanvas to read your Canva designs and brand
                  templates.
                </p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  <li>Use Connect to Canva, then approve access in Canva.</li>
                  <li>You&apos;ll return here when the connection succeeds.</li>
                  <li>Disconnect anytime to revoke access from this app.</li>
                </ul>
              </div>
            )}
          </div>

          {connection.connected ? (
            <Button
              type="button"
              variant="outline"
              className={cn(settingsOutlineButtonClassName, "shrink-0")}
              disabled={disconnectMutation.isPending}
              aria-busy={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate()}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Unlink className="size-4" aria-hidden />
              )}
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
            </Button>
          ) : (
            <ConnectCanvaButton className="shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
