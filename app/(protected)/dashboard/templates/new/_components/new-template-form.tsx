"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, FilePlus2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import { settingsPrimaryButtonClassName } from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
import { DesignPreview } from "@/components/templates/design-renderer"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { queryKeys } from "@/lib/query/keys"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import {
  CUSTOM_PRESET_ID,
  defaultPageSizePreset,
  findPresetBySize,
  pageSizePresets,
} from "@/lib/templates/presets"
import { starterTemplates } from "@/lib/templates/starters"
import { countVariables, extractTemplateVariables } from "@/lib/templates/variables"
import {
  BLANK_STARTER_ID,
  createTemplateSchema,
  type CreateTemplateInput,
  type TemplateApiResponse,
} from "@/schemas/templates/template"
import { cn } from "@/lib/utils"

const selectTriggerClassName =
  "h-11 w-full min-w-0 rounded-sm border border-brand-input-border bg-brand-input px-3 py-7 text-base text-brand-text-heading md:text-sm"

export function NewTemplateForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [presetId, setPresetId] = useState(defaultPageSizePreset.id)
  const [starterId, setStarterId] = useState(BLANK_STARTER_ID)

  const starterDesigns = useMemo(
    () => starterTemplates.map((starter) => ({ starter, design: starter.build() })),
    []
  )

  const form = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "",
      width: defaultPageSizePreset.width,
      height: defaultPageSizePreset.height,
      starter: BLANK_STARTER_ID,
    },
  })

  const width = form.watch("width")
  const height = form.watch("height")
  const previewRatio =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? width / height
      : 1
  const selectedStarter = starterDesigns.find((item) => item.starter.id === starterId) ?? null

  const createMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (input: CreateTemplateInput) =>
      apiClient<TemplateApiResponse>("/api/templates", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates.list() })
      router.push(dashboardRoutes.template(response.data.id))
    },
  })

  function applyPreset(nextId: string) {
    setPresetId(nextId)
    const preset = pageSizePresets.find((item) => item.id === nextId)

    if (preset) {
      form.setValue("width", preset.width, { shouldValidate: true })
      form.setValue("height", preset.height, { shouldValidate: true })
    }
  }

  function syncPresetFromSize() {
    const values = form.getValues()
    const match = findPresetBySize(values.width, values.height)
    setPresetId(match?.id ?? CUSTOM_PRESET_ID)
  }

  function chooseStarter(id: string) {
    setStarterId(id)
    form.setValue("starter", id)

    const starter = starterTemplates.find((item) => item.id === id)

    if (starter) {
      form.setValue("width", starter.width, { shouldValidate: true })
      form.setValue("height", starter.height, { shouldValidate: true })
      setPresetId(findPresetBySize(starter.width, starter.height)?.id ?? CUSTOM_PRESET_ID)

      if (!form.getValues("name").trim()) {
        form.setValue("name", starter.name, { shouldValidate: true })
      }
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Start from</CardTitle>
          <CardDescription>
            Pick a ready-made design to edit, or start blank. Every starter comes with variables
            wired up so you can call the API right away.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <button
              type="button"
              aria-pressed={starterId === BLANK_STARTER_ID}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border bg-card text-start transition-shadow hover:shadow-md",
                starterId === BLANK_STARTER_ID ? "border-brand-teal ring-2 ring-brand-teal/30" : "border-border/70"
              )}
              onClick={() => chooseStarter(BLANK_STARTER_ID)}
            >
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-brand-mist/40 p-3">
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-brand-slate/50 bg-white text-brand-slate">
                  <FilePlus2 className="size-5" aria-hidden />
                  <span className="text-[11px]">Empty page</span>
                </div>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium text-brand-text-heading">Blank</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Any size, your own layout.</p>
              </div>
            </button>

            {starterDesigns.map(({ starter, design }) => {
              const variableCount = countVariables(extractTemplateVariables(design))

              return (
                <button
                  key={starter.id}
                  type="button"
                  aria-pressed={starterId === starter.id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-xl border bg-card text-start transition-shadow hover:shadow-md",
                    starterId === starter.id ? "border-brand-teal ring-2 ring-brand-teal/30" : "border-border/70"
                  )}
                  onClick={() => chooseStarter(starter.id)}
                >
                  <div className="aspect-[4/3] w-full bg-brand-mist/40 p-3">
                    <DesignPreview design={design} className="h-full w-full" />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-brand-text-heading">{starter.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {starter.description} {variableCount} variables.
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Template details</CardTitle>
            <CardDescription>
              Sizes are in PDF points (A4 is 595 × 842). You can change the size and add pages
              later in the editor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
            >
              <input type="hidden" {...form.register("starter")} />

              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="template-name">Name</FieldLabel>
                <Input
                  id="template-name"
                  placeholder="e.g. Course certificate"
                  autoComplete="off"
                  autoFocus
                  disabled={createMutation.isPending}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="template-preset">Page size</FieldLabel>
                <Select value={presetId} onValueChange={applyPreset} disabled={selectedStarter !== null}>
                  <SelectTrigger id="template-preset" className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start" className="max-h-72">
                    {pageSizePresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {preset.width} × {preset.height} · {preset.hint}
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_PRESET_ID}>Custom size</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!form.formState.errors.width}>
                  <FieldLabel htmlFor="template-width">Width (px)</FieldLabel>
                  <Input
                    id="template-width"
                    type="number"
                    inputMode="numeric"
                    min={20}
                    max={14400}
                    disabled={createMutation.isPending || selectedStarter !== null}
                    {...form.register("width", {
                      valueAsNumber: true,
                      onChange: syncPresetFromSize,
                    })}
                  />
                  <FieldError errors={[form.formState.errors.width]} />
                </Field>
                <Field data-invalid={!!form.formState.errors.height}>
                  <FieldLabel htmlFor="template-height">Height (px)</FieldLabel>
                  <Input
                    id="template-height"
                    type="number"
                    inputMode="numeric"
                    min={20}
                    max={14400}
                    disabled={createMutation.isPending || selectedStarter !== null}
                    {...form.register("height", {
                      valueAsNumber: true,
                      onChange: syncPresetFromSize,
                    })}
                  />
                  <FieldError errors={[form.formState.errors.height]} />
                </Field>
              </div>

              {selectedStarter ? (
                <p className="text-xs text-muted-foreground">
                  The size comes from the starter so its layout fits. You can still resize it in
                  the editor.
                </p>
              ) : null}

              {createMutation.isError ? (
                <p className="text-sm text-destructive">
                  {createMutation.error instanceof Error
                    ? createMutation.error.message
                    : "Could not create template"}
                </p>
              ) : null}

              <Button
                type="submit"
                className={settingsPrimaryButtonClassName}
                disabled={createMutation.isPending}
              >
                Open editor
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {selectedStarter ? selectedStarter.starter.description : "Page proportions at a glance."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-64 items-center justify-center">
            {selectedStarter ? (
              <DesignPreview design={selectedStarter.design} className="h-64 w-full" />
            ) : (
              <div
                className="max-h-64 max-w-full border border-border bg-white shadow-sm"
                style={{
                  aspectRatio: previewRatio,
                  width: previewRatio >= 1 ? "100%" : undefined,
                  height: previewRatio < 1 ? "16rem" : undefined,
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
