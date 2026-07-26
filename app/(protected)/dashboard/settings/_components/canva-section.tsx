"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link2, Loader2, Unlink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  settingsOutlineButtonClassName,
  settingsPrimaryButtonClassName,
} from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
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
import { queryKeys } from "@/lib/query/keys"
import type { CanvaConnectionStatus } from "@/lib/services/canva/connection"
import { cn } from "@/lib/utils"

const CANVA_CONNECT_URL = "/api/auth/canva/connect"

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
  const [isConnecting, setIsConnecting] = useState(false)

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
          error instanceof Error ? error.message : "Could not disconnect Canva.",
      })
    },
  })

  function handleConnect() {
    setIsConnecting(true)
    window.location.assign(CANVA_CONNECT_URL)
  }

  const connectedAtLabel = formatConnectedAt(connection.connectedAt)

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Canva</CardTitle>
          <Badge variant={connection.connected ? "default" : "secondary"}>
            {connection.connected ? "Connected" : "Not connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <CardDescription>
              Connect your Canva account to import and sync templates.
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
              <>
                {connectedAtLabel ? (
                  <p className="text-sm text-muted-foreground">
                    Connected {connectedAtLabel}
                  </p>
                ) : null}
                {connection.scopes ? (
                  <p className="text-xs text-muted-foreground">
                    Scopes: {connection.scopes}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Authorize flowkanvas to access your Canva designs and brand templates.
              </p>
            )}
          </div>

          {connection.connected ? (
            <Button
              type="button"
              variant="outline"
              className={cn(settingsOutlineButtonClassName, "shrink-0")}
              disabled={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate()}
            >
              <Unlink className="size-4" aria-hidden />
              Disconnect
            </Button>
          ) : (
            <Button
              type="button"
              className={cn(settingsPrimaryButtonClassName, "shrink-0")}
              disabled={isConnecting}
              aria-busy={isConnecting}
              onClick={handleConnect}
            >
              {isConnecting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Link2 className="size-4" aria-hidden />
              )}
              {isConnecting ? "Redirecting..." : "Connect Canva"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
