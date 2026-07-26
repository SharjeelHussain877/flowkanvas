"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LogOut, MonitorSmartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import {
  settingsOutlineButtonClassName,
} from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"
import type {
  RevokeOtherSessionsResponse,
  RevokeSessionResponse,
  SessionsListResponse,
  UserSession,
} from "@/schemas/settings/session"

type SessionsSectionProps = {
  initialData: SessionsListResponse["data"]
  loadError?: string | null
}

export function SessionsSection({
  initialData,
  loadError = null,
}: SessionsSectionProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const hasSyncedDeviceRef = useRef(false)

  const syncDeviceMutation = useMutation({
    mutationFn: (userAgent: string) =>
      apiClient<{ data: { success: true } }>("/api/settings/sessions/sync-device", {
        method: "POST",
        body: JSON.stringify({ userAgent }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list() })
    },
  })

  useEffect(() => {
    if (loadError || hasSyncedDeviceRef.current || typeof navigator === "undefined") {
      return
    }

    const userAgent = navigator.userAgent.trim()
    if (!userAgent) {
      return
    }

    hasSyncedDeviceRef.current = true
    syncDeviceMutation.mutate(userAgent)
  }, [loadError, queryClient, syncDeviceMutation])

  const sessionsQuery = useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: () => apiClient<SessionsListResponse>("/api/settings/sessions"),
    initialData: loadError ? undefined : { data: initialData },
    enabled: !loadError,
    select: (response) => response.data,
  })

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionIds: string[]) => {
      let revokedCurrentSession = false

      for (const sessionId of sessionIds) {
        const response = await apiClient<RevokeSessionResponse>(
          `/api/settings/sessions/${sessionId}/revoke`,
          { method: "POST" }
        )

        if (response.data.revokedCurrentSession) {
          revokedCurrentSession = true
        }
      }

      return { revokedCurrentSession }
    },
    onSuccess: (response) => {
      if (response.revokedCurrentSession) {
        router.push("/login")
        router.refresh()
        return
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list() })
    },
    onError: (error) => {
      console.error(error)
    },
  })

  const revokeOthersMutation = useMutation({
    mutationFn: () =>
      apiClient<RevokeOtherSessionsResponse>(
        "/api/settings/sessions/revoke-others",
        { method: "POST" }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list() })
    },
    onError: (error) => {
      console.error(error)
    },
  })

  const sessions = sessionsQuery.data?.sessions ?? []
  const isPending =
    revokeSessionMutation.isPending || revokeOthersMutation.isPending

  const canRevokeOthers =
    !loadError &&
    !isPending &&
    sessions.filter((session) => !session.isCurrent).length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            Devices currently signed in to your account. Multiple sessions are
            allowed.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!canRevokeOthers}
          aria-label="Sign out all other devices"
          className={`shrink-0 ${settingsOutlineButtonClassName}`}
          onClick={() => revokeOthersMutation.mutate()}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign out all other devices</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : sessionsQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active sessions found.
          </p>
        ) : (
          sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              disabled={isPending}
              onRevoke={() =>
                revokeSessionMutation.mutate(
                  session.revokeSessionIds.length > 0
                    ? session.revokeSessionIds
                    : [session.id]
                )
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}

type SessionRowProps = {
  session: UserSession
  disabled: boolean
  onRevoke: () => void
}

function SessionRow({ session, disabled, onRevoke }: SessionRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-brand-surface px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <MonitorSmartphone
          className="mt-0.5 size-4 shrink-0 text-brand-text-muted"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="font-medium">
            {session.deviceLabel} · {session.browserLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {session.isCurrent ? "Current session" : "Active session"}
            {session.sessionCount > 1
              ? ` · ${session.sessionCount} sessions on this device`
              : ""}
            {session.ipAddress ? ` · ${session.ipAddress}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Last active {session.lastActiveAt}
          </p>
        </div>
      </div>
      {!session.isCurrent ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="shrink-0 text-brand-text-muted hover:text-destructive"
          onClick={onRevoke}
        >
          Sign out
        </Button>
      ) : null}
    </div>
  )
}
