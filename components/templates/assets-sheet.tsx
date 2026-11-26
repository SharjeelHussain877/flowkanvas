"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, Trash2, Type, Upload } from "lucide-react"
import { useRef } from "react"

import type { AssetsTab } from "@/app/(protected)/dashboard/templates/[id]/_components/editor-ui-context"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { apiClient } from "@/lib/api/client"
import { useAssetsQuery } from "@/lib/query/hooks/use-assets"
import { useFontsQuery } from "@/lib/query/hooks/use-fonts"
import { queryKeys } from "@/lib/query/keys"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import { groupFontFamilies } from "@/lib/templates/fonts"
import type {
  AssetApiResponse,
  AssetRecord,
  AssetsListResponse,
  DeleteAssetApiResponse,
} from "@/schemas/assets/asset"
import {
  describeFontStyle,
  type DeleteFontApiResponse,
  type FontApiResponse,
  type FontsListResponse,
} from "@/schemas/fonts/font"
import { cn } from "@/lib/utils"

type AssetsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tab: AssetsTab
  onTabChange: (tab: AssetsTab) => void
  /** Called when the user clicks an image; the caller places or swaps it on the canvas. */
  onPickImage: (asset: AssetRecord) => void
  pickLabel: string
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function ErrorText({ error }: { error: unknown }) {
  if (!error) {
    return null
  }

  return (
    <p className="text-sm text-destructive">
      {error instanceof Error ? error.message : "Something went wrong"}
    </p>
  )
}

function ImagesPanel({ onPick, pickLabel }: { onPick: (asset: AssetRecord) => void; pickLabel: string }) {
  const queryClient = useQueryClient()
  const assetsQuery = useAssetsQuery()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.set("file", file)
      return apiClient<AssetApiResponse>("/api/assets", { method: "POST", body: formData })
    },
    onSuccess: (response) => {
      queryClient.setQueryData<AssetsListResponse>(queryKeys.assets.list(), (current) => ({
        data: [response.data, ...(current?.data ?? [])],
      }))
    },
  })

  const deleteMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (id: string) =>
      apiClient<DeleteAssetApiResponse>(`/api/assets/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: (response) => {
      queryClient.setQueryData<AssetsListResponse>(queryKeys.assets.list(), (current) => ({
        data: (current?.data ?? []).filter((asset) => asset.id !== response.data.id),
      }))
    },
  })

  const assets = assetsQuery.data ?? []

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        className="sr-only"
        onChange={(event) => {
          for (const file of Array.from(event.target.files ?? [])) {
            uploadMutation.mutate(file)
          }

          event.target.value = ""
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden />
          Upload images
        </Button>
        <span className="text-xs text-muted-foreground">PNG or JPEG, up to 5 MB</span>
      </div>

      <ErrorText error={uploadMutation.error ?? deleteMutation.error ?? assetsQuery.error} />

      {assetsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading images...</p>
      ) : assets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-slate/50 p-6 text-center text-sm text-muted-foreground">
          <ImagePlus className="mx-auto mb-2 size-6 opacity-60" aria-hidden />
          No images yet. Upload logos, photos and backgrounds once and reuse them in every
          template.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {assets.map((asset) => (
            <li key={asset.id} className="group relative">
              <button
                type="button"
                title={pickLabel}
                className="flex w-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card text-start transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-teal"
                onClick={() => onPick(asset)}
              >
                <div className="aspect-square w-full bg-[linear-gradient(45deg,#eef1f5_25%,transparent_25%,transparent_75%,#eef1f5_75%),linear-gradient(45deg,#eef1f5_25%,transparent_25%,transparent_75%,#eef1f5_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.name} className="h-full w-full object-contain" />
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-brand-text-heading">{asset.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatSize(asset.size)}</p>
                </div>
              </button>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label={`Delete ${asset.name}`}
                className="absolute end-1.5 top-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(asset.id)}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Click an image to {pickLabel.toLowerCase()}. Deleting an image removes it from PDFs that
        still use it.
      </p>
    </div>
  )
}

function FontsPanel() {
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

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,font/ttf,font/otf"
        multiple
        className="sr-only"
        onChange={(event) => {
          for (const file of Array.from(event.target.files ?? [])) {
            uploadMutation.mutate(file)
          }

          event.target.value = ""
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden />
          Upload fonts
        </Button>
        <span className="text-xs text-muted-foreground">.ttf or .otf, up to 5 MB</span>
      </div>

      <ErrorText error={uploadMutation.error ?? deleteMutation.error ?? fontsQuery.error} />

      {fontsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading fonts...</p>
      ) : families.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-slate/50 p-6 text-center text-sm text-muted-foreground">
          <Type className="mx-auto mb-2 size-6 opacity-60" aria-hidden />
          No custom fonts yet. Upload the regular, bold and italic files of a family and they
          are grouped automatically.
        </div>
      ) : (
        <ul className="space-y-2">
          {families.map((family) => (
            <li key={family.family} className="rounded-lg border border-border/70 p-3">
              <p
                className="text-base text-brand-text-heading"
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
        Fonts are embedded in every PDF. Deleting one makes templates that use it fall back to
        Helvetica.
      </p>
    </div>
  )
}

const TABS: Array<{ id: AssetsTab; label: string }> = [
  { id: "images", label: "Images" },
  { id: "fonts", label: "Fonts" },
]

/** Side sheet with the user's reusable uploads: images for the canvas and font files. */
export function AssetsSheet({
  open,
  onOpenChange,
  tab,
  onTabChange,
  onPickImage,
  pickLabel,
}: AssetsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Assets</SheetTitle>
          <SheetDescription>
            Upload once, use in any template. Images go straight onto the canvas; fonts appear
            in the text font picker.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <div className="mb-4 flex border-b border-border/70" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={cn(
                  "flex-1 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  tab === item.id
                    ? "border-brand-teal text-brand-text-heading"
                    : "border-transparent text-brand-text-muted hover:text-brand-text-heading"
                )}
                onClick={() => onTabChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "images" ? <ImagesPanel onPick={onPickImage} pickLabel={pickLabel} /> : <FontsPanel />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
