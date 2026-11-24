"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LayoutTemplate, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { TemplatePreviewCard } from "@/app/(protected)/dashboard/templates/_components/template-preview-card"
import { useStaggeredReveal } from "@/app/(protected)/dashboard/templates/_components/use-staggered-reveal"
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
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { queryKeys } from "@/lib/query/keys"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import type {
  DeleteTemplateApiResponse,
  TemplateRecord,
  TemplatesListResponse,
} from "@/schemas/templates/template"

type TemplatesListProps = {
  initialData: TemplateRecord[]
  loadError?: string | null
}

export function TemplatesList({ initialData, loadError = null }: TemplatesListProps) {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<TemplateRecord | null>(null)

  const templatesQuery = useQuery({
    queryKey: queryKeys.templates.list(),
    queryFn: () => apiClient<TemplatesListResponse>("/api/templates"),
    initialData: loadError ? undefined : { data: initialData },
    enabled: !loadError,
    select: (response) => response.data,
  })

  const deleteMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (id: string) =>
      apiClient<DeleteTemplateApiResponse>(`/api/templates/${id}`, { method: "DELETE" }),
    onSuccess: (response) => {
      queryClient.setQueryData<TemplatesListResponse>(
        queryKeys.templates.list(),
        (current) => ({
          data: (current?.data ?? []).filter((item) => item.id !== response.data.id),
        })
      )
      queryClient.removeQueries({ queryKey: queryKeys.templates.detail(response.data.id) })
      setDeleteTarget(null)
    },
  })

  const templates = templatesQuery.data ?? initialData
  const visibleCount = useStaggeredReveal(templates.length, templates.length > 0)

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

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="size-5 text-brand-teal" aria-hidden />
            No templates yet
          </CardTitle>
          <CardDescription>
            Create a template, design it on the canvas with text, images and shapes,
            and use <code>{"{{variables}}"}</code> for the parts that change per PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={dashboardRoutes.templateNew}>
              <Plus className="size-4" aria-hidden />
              Create your first template
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {templates.map((template, index) =>
          index < visibleCount ? (
            <TemplatePreviewCard
              key={template.id}
              template={template}
              onDelete={() => setDeleteTarget(template)}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards"
            />
          ) : (
            <Skeleton key={template.id} className="aspect-[3/4] w-full rounded-xl" />
          )
        )}
      </div>

      {deleteMutation.isError ? (
        <p className="mt-4 text-sm text-destructive">
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : "Could not delete template"}
        </p>
      ) : null}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" will be removed permanently. API requests for it will start failing immediately.`
                : "This template will be removed permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault()

                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id)
                }
              }}
            >
              Delete template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
