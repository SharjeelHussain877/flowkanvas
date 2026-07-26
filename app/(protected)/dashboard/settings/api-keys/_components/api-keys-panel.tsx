"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Check, Copy, KeyRound, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { queryKeys } from "@/lib/query/keys"
import {
  createApiKeySchema,
  type CreateApiKeyInput,
} from "@/schemas/api-keys/create-api-key"
import type {
  ApiKeysListResponse,
  CreateApiKeyApiResponse,
  PublicApiKey,
  RevokeApiKeyApiResponse,
} from "@/schemas/api-keys/api-key"

type ApiKeysPanelProps = {
  initialData: PublicApiKey[]
  loadError?: string | null
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Never"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function ApiKeyStatusBadge({ revoked }: { revoked: boolean }) {
  return revoked ? (
    <Badge variant="outline">Revoked</Badge>
  ) : (
    <Badge>Active</Badge>
  )
}

export function ApiKeysPanel({ initialData, loadError = null }: ApiKeysPanelProps) {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [secretOpen, setSecretOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [secretCopied, setSecretCopied] = useState(false)
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<PublicApiKey | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  function clearCopyResetTimeout() {
    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current)
      copyResetTimeoutRef.current = null
    }
  }

  function scheduleCopyIconReset() {
    clearCopyResetTimeout()
    copyResetTimeoutRef.current = setTimeout(() => {
      setSecretCopied(false)
      copyResetTimeoutRef.current = null
    }, 3000)
  }

  const form = useForm<CreateApiKeyInput>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: { name: "" },
  })

  const apiKeysQuery = useQuery({
    queryKey: queryKeys.apiKeys.list(),
    queryFn: () => apiClient<ApiKeysListResponse>("/api/api-keys"),
    initialData: loadError ? undefined : { data: initialData },
    enabled: !loadError,
    select: (response) => response.data,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateApiKeyInput) =>
      apiClient<CreateApiKeyApiResponse>("/api/api-keys", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData<ApiKeysListResponse>(
        queryKeys.apiKeys.list(),
        (current) => ({
          data: [response.data.key, ...(current?.data ?? [])],
        })
      )
      setCreateOpen(false)
      form.reset()
      clearCopyResetTimeout()
      setCreatedSecret(response.data.secret)
      setSecretCopied(false)
      setSecretOpen(true)
    },
    onError: (error) => {
      console.error(error)
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (apiKeyId: string) =>
      apiClient<RevokeApiKeyApiResponse>(`/api/api-keys/${apiKeyId}/revoke`, {
        method: "POST",
      }),
    onSuccess: (response) => {
      queryClient.setQueryData<ApiKeysListResponse>(
        queryKeys.apiKeys.list(),
        (current) => ({
          data: (current?.data ?? []).map((key) =>
            key.id === response.data.id ? response.data : key
          ),
        })
      )
      setRevokeTarget(null)
    },
    onError: (error) => {
      console.error(error)
    },
  })

  async function handleCopySecret() {
    if (!createdSecret) {
      return
    }

    const copied = await copyToClipboard(createdSecret)

    if (copied) {
      setSecretCopied(true)
      scheduleCopyIconReset()
      return
    }

    console.error("Unable to copy to clipboard")
  }

  function handleCreateOpenChange(nextOpen: boolean) {
    if (createMutation.isPending) {
      return
    }

    setCreateOpen(nextOpen)

    if (!nextOpen) {
      form.reset()
    }
  }

  function handleSecretOpenChange(nextOpen: boolean) {
    setSecretOpen(nextOpen)

    if (!nextOpen) {
      clearCopyResetTimeout()
      setCreatedSecret(null)
      setSecretCopied(false)
    }
  }

  function onCreateSubmit(values: CreateApiKeyInput) {
    createMutation.mutate(values)
  }

  const keys = apiKeysQuery.data ?? initialData
  const listError = loadError ?? (apiKeysQuery.isError
    ? apiKeysQuery.error instanceof Error
      ? apiKeysQuery.error.message
      : "Failed to load API keys"
    : null)
  const exampleMaskedKey =
    keys.find((key) => !key.revoked)?.masked_key ??
    "pdf_sk_live_abcd************************"

  return (
    <>
      <div className="grid gap-4">
        {listError ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Unable to load API keys</p>
              <p>{listError}</p>
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>API keys</CardTitle>
              <CardDescription>
                Create keys for server-side PDF generation requests. Secrets are
                shown only once at creation.
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={Boolean(listError)}
            >
              <Plus className="size-4" />
              Generate API key
            </Button>
          </CardHeader>
          <CardContent>
            {listError ? null : apiKeysQuery.isError ? (
              <p className="text-sm text-destructive">
                {apiKeysQuery.error instanceof Error
                  ? apiKeysQuery.error.message
                  : "Failed to load API keys"}
              </p>
            ) : keys.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-brand-surface px-4 py-10 text-center">
                <KeyRound className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-brand-text-heading">
                  No API keys yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate your first key to authenticate PDF rendering requests.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-start text-muted-foreground">
                      <th className="px-2 py-3 font-medium">Name</th>
                      <th className="px-2 py-3 font-medium">Key</th>
                      <th className="px-2 py-3 font-medium">Created</th>
                      <th className="px-2 py-3 font-medium">Last used</th>
                      <th className="px-2 py-3 font-medium">Status</th>
                      <th className="px-2 py-3 text-end font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((key) => (
                      <tr
                        key={key.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="px-2 py-4 font-medium">{key.name}</td>
                        <td className="px-2 py-4">
                          <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                            {key.masked_key}
                          </code>
                        </td>
                        <td className="px-2 py-4 text-muted-foreground">
                          {formatDate(key.created_at)}
                        </td>
                        <td className="px-2 py-4 text-muted-foreground">
                          {formatDate(key.last_used_at)}
                        </td>
                        <td className="px-2 py-4">
                          <ApiKeyStatusBadge revoked={key.revoked} />
                        </td>
                        <td className="px-2 py-4 text-end">
                          {!key.revoked ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={revokeMutation.isPending}
                              onClick={() => setRevokeTarget(key)}
                            >
                              Revoke
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage snippet</CardTitle>
            <CardDescription>
              Example request using your flowkanvas API key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl bg-brand-navy p-4 text-xs text-brand-mist">
              {`curl -X POST https://api.flowkanvas.app/v1/templates/template-id/generate \\
  -H "Authorization: Bearer ${exampleMaskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"payload":{"name":"Aliyah"}}'`}
            </pre>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <KeyRound className="size-4" />
              Never expose API keys in client-side code.
            </div>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate API key</DialogTitle>
            <DialogDescription>
              Give this key a name so you can identify it later.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onCreateSubmit)}
          >
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="api-key-name">Key name</FieldLabel>
              <Input
                id="api-key-name"
                placeholder="Enter a name for this API key"
                autoComplete="off"
                disabled={createMutation.isPending}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending}
                onClick={() => handleCreateOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Generate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={secretOpen} onOpenChange={handleSecretOpenChange}>
        <DialogContent
          className="sm:max-w-lg"
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Save your API key</DialogTitle>
            <DialogDescription>
              Copy this API key now. You will not be able to view it again.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Store this key in your backend secrets manager. It will not be
              shown again after you close this dialog.
            </p>
          </div>

          <Input
            readOnly
            value={createdSecret ?? ""}
            className="font-mono text-xs"
            endIcon={
              <button
                type="button"
                aria-label={secretCopied ? "Copied" : "Copy API key"}
                className="flex size-4 items-center justify-center text-brand-text-muted transition-colors hover:text-brand-text-heading"
                onClick={handleCopySecret}
              >
                {secretCopied ? (
                  <Check className="size-4 text-brand-teal" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            }
          />

          <DialogFooter>
            <Button type="button" onClick={() => handleSecretOpenChange(false)}>
              I have saved my key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !revokeMutation.isPending) {
            setRevokeTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget
                ? `"${revokeTarget.name}" will stop working immediately. This action cannot be undone, but the record will remain in your history.`
                : "This key will stop working immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revokeMutation.isPending}
              onClick={(event) => {
                event.preventDefault()

                if (revokeTarget) {
                  revokeMutation.mutate(revokeTarget.id)
                }
              }}
            >
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
