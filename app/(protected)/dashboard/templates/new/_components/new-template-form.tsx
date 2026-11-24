"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { settingsPrimaryButtonClassName } from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
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
import {
  createTemplateSchema,
  type CreateTemplateInput,
  type TemplateApiResponse,
} from "@/schemas/templates/template"

const selectTriggerClassName =
  "h-11 w-full min-w-0 rounded-sm border border-brand-input-border bg-brand-input px-3 py-7 text-base text-brand-text-heading md:text-sm"

export function NewTemplateForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [presetId, setPresetId] = useState(defaultPageSizePreset.id)

  const form = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "",
      width: defaultPageSizePreset.width,
      height: defaultPageSizePreset.height,
    },
  })

  const width = form.watch("width")
  const height = form.watch("height")
  const previewRatio =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? width / height
      : 1

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

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Template details</CardTitle>
          <CardDescription>
            Sizes are in PDF points (A4 is 595 × 842). You can change the size later in
            the editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          >
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
              <Select value={presetId} onValueChange={applyPreset}>
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
                  disabled={createMutation.isPending}
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
                  disabled={createMutation.isPending}
                  {...form.register("height", {
                    valueAsNumber: true,
                    onChange: syncPresetFromSize,
                  })}
                />
                <FieldError errors={[form.formState.errors.height]} />
              </Field>
            </div>

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
          <CardDescription>Page proportions at a glance.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-64 items-center justify-center">
          <div
            className="max-h-64 max-w-full border border-border bg-white shadow-sm"
            style={{
              aspectRatio: previewRatio,
              width: previewRatio >= 1 ? "100%" : undefined,
              height: previewRatio < 1 ? "16rem" : undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
