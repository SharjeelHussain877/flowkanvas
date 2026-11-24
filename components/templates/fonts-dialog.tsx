"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, Upload } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api/client"
import { useFontsQuery } from "@/lib/query/hooks/use-fonts"
import { queryKeys } from "@/lib/query/keys"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import { groupFontFamilies } from "@/lib/templates/fonts"
import {
  describeFontStyle,
  type DeleteFontApiResponse,
  type FontApiResponse,
  type FontRecord,
  type FontsListResponse,
} from "@/schemas/fonts/font"

type FontsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after an upload so the caller can select the new family. */
  onUploaded?: (font: FontRecord) => void
}

export function FontsDialog({ open, onOpenChange, onUploaded }: FontsDialogProps) {
  const queryClient = useQueryClient()
  const fontsQuery = useFontsQuery()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.set("file", file)

      return apiClient<FontApiResponse>("/api/fonts", { method: "POST", body: formData })
    },
    onSuccess: (response) => {
      queryClient.setQueryData<FontsListResponse>(queryKeys.fonts.list(), (current) => ({
        data: [
          ...(current?.data ?? []).filter((font) => font.id !== response.data.id),
          response.data,
        ],
      }))
      onUploaded?.(response.data)
    },
  })

  const deleteMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (id: string) =>
      apiClient<DeleteFontApiResponse>(`/api/fonts/${id}`, { method: "DELETE" }),
    onSuccess: (response) => {
      queryClient.setQueryData<FontsListResponse>(queryKeys.fonts.list(), (current) => ({
        data: (current?.data ?? []).filter((font) => font.id !== response.data.id),
      }))
    },
  })

  const families = groupFontFamilies(fontsQuery.data ?? [])
  const error = uploadMutation.error ?? deleteMutation.error ?? fontsQuery.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Custom fonts</DialogTitle>
          <DialogDescription>
            Upload .ttf or .otf files. Upload the bold and italic files of a family separately
            and they are grouped automatically. Fonts are embedded in every PDF.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".ttf,.otf,font/ttf,font/otf"
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])

            for (const file of files) {
              uploadMutation.mutate(file)
            }

            event.target.value = ""
          }}
        />

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" aria-hidden />
            Upload font files
          </Button>

          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          ) : null}

          {fontsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Loading fonts...</p>
          ) : families.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No custom fonts yet. Brand fonts, Urdu or Arabic fonts and Google Fonts downloads
              all work.
            </p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pe-1">
              {families.map((family) => (
                <li key={family.family} className="rounded-lg border border-border/70 p-3">
                  <p
                    className="text-sm font-medium text-brand-text-heading"
                    style={{ fontFamily: `"${family.family}", Helvetica, Arial, sans-serif` }}
                  >
                    {family.name}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {family.fonts.map((font) => (
                      <li key={font.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">{describeFontStyle(font)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${family.name} ${describeFontStyle(font)}`}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(font.id)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-muted-foreground">
            Deleting a font makes templates that use it fall back to Helvetica.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
