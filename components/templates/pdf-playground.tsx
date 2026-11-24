"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { FileDown, ImageUp, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { settingsPrimaryButtonClassName } from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import { extractTemplateVariables } from "@/lib/templates/variables"
import type {
  TemplateApiResponse,
  TemplateRecord,
  TemplatesListResponse,
} from "@/schemas/templates/template"
import { cn } from "@/lib/utils"

type PdfPlaygroundProps = {
  /** Lock the tester to one template (editor sheet). */
  initialTemplate?: TemplateRecord | null
  className?: string
  /** Render without the outer card chrome. */
  bare?: boolean
}

type GenerateResult = {
  url: string
  missing: string[]
  warning: string | null
}

async function generatePdfRequest(
  templateId: string,
  values: Record<string, string>,
  files: Record<string, File | null>
): Promise<GenerateResult> {
  const formData = new FormData()

  for (const [name, value] of Object.entries(values)) {
    formData.set(name, value)
  }

  for (const [name, file] of Object.entries(files)) {
    if (file) {
      formData.set(name, file)
    }
  }

  const response = await fetch(`/api/templates/${templateId}/generate?inline=1`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "PDF generation failed")
  }

  const missing = response.headers.get("X-Flowkanvas-Missing-Variables")
  const blob = await response.blob()

  return {
    url: URL.createObjectURL(blob),
    missing: missing ? missing.split(",").filter(Boolean) : [],
    warning: response.headers.get("X-Flowkanvas-Warning"),
  }
}

export function PdfPlayground({
  initialTemplate = null,
  className,
  bare = false,
}: PdfPlaygroundProps) {
  const [selectedId, setSelectedId] = useState(initialTemplate?.id ?? "")
  const [values, setValues] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [result, setResult] = useState<GenerateResult | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const templatesQuery = useQuery({
    queryKey: queryKeys.templates.list(),
    queryFn: () => apiClient<TemplatesListResponse>("/api/templates"),
    enabled: !initialTemplate,
    select: (response) => response.data,
  })

  const templateQuery = useQuery({
    queryKey: queryKeys.templates.detail(selectedId),
    queryFn: () => apiClient<TemplateApiResponse>(`/api/templates/${selectedId}`),
    enabled: Boolean(selectedId),
    initialData: initialTemplate ? { data: initialTemplate } : undefined,
    select: (response) => response.data,
  })

  const template = initialTemplate ?? templateQuery.data ?? null
  const variables = useMemo(
    () =>
      template ? extractTemplateVariables(template.design) : { text: [], images: [] },
    [template]
  )
  const hasVariables = variables.text.length + variables.images.length > 0

  useEffect(() => {
    return () => {
      if (result) {
        URL.revokeObjectURL(result.url)
      }
    }
  }, [result])

  const generateMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: () => {
      if (!template) {
        throw new Error("Select a template first")
      }

      return generatePdfRequest(template.id, values, files)
    },
    onSuccess: (next) => {
      setResult((current) => {
        if (current) {
          URL.revokeObjectURL(current.url)
        }
        return next
      })
    },
  })

  function resetForTemplate(id: string) {
    setSelectedId(id)
    setValues({})
    setFiles({})
    setResult(null)
  }

  const content = (
    <div className="space-y-4">
      {initialTemplate ? null : (
        <Field>
          <FieldLabel htmlFor="playground-template">Template</FieldLabel>
          <Select value={selectedId || undefined} onValueChange={resetForTemplate}>
            <SelectTrigger
              id="playground-template"
              className="h-11 w-full min-w-0 rounded-sm border border-brand-input-border bg-brand-input px-3 py-7 text-base text-brand-text-heading md:text-sm"
            >
              <SelectValue
                placeholder={
                  templatesQuery.isPending
                    ? "Loading templates..."
                    : (templatesQuery.data?.length ?? 0) === 0
                      ? "No templates yet - create one first"
                      : "Select a template"
                }
              />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              className="w-(--radix-select-trigger-width) max-h-60"
            >
              {(templatesQuery.data ?? []).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {template && !hasVariables ? (
        <p className="text-sm text-muted-foreground">
          This template has no variables yet. Add <code>{"{{name}}"}</code> to a text
          box or bind an image to a variable in the editor, then test it here. You can
          still generate the static PDF.
        </p>
      ) : null}

      {variables.text.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {variables.text.map((name) => (
            <Field key={name}>
              <FieldLabel htmlFor={`payload-${name}`}>{name}</FieldLabel>
              <Input
                id={`payload-${name}`}
                value={values[name] ?? ""}
                placeholder={`Value for ${name}`}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [name]: event.target.value }))
                }
              />
            </Field>
          ))}
        </div>
      ) : null}

      {variables.images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {variables.images.map((name) => {
            const file = files[name] ?? null

            return (
              <Field key={name}>
                <FieldLabel htmlFor={`payload-file-${name}`}>
                  {name} <span className="text-xs text-muted-foreground">(image)</span>
                </FieldLabel>
                <input
                  id={`payload-file-${name}`}
                  ref={(node) => {
                    fileInputs.current[name] = node
                  }}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(event) => {
                    const next = event.target.files?.[0] ?? null
                    setFiles((current) => ({ ...current, [name]: next }))
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => fileInputs.current[name]?.click()}
                  >
                    <ImageUp className="size-4" aria-hidden />
                    {file ? "Change" : "Choose PNG or JPEG"}
                  </Button>
                  {file ? (
                    <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${name}`}
                        className="shrink-0 rounded p-0.5 hover:text-brand-text-heading"
                        onClick={() => {
                          setFiles((current) => ({ ...current, [name]: null }))
                          const input = fileInputs.current[name]
                          if (input) {
                            input.value = ""
                          }
                        }}
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </span>
                  ) : null}
                </div>
              </Field>
            )
          })}
        </div>
      ) : null}

      {generateMutation.isError ? (
        <p className="text-sm text-destructive">
          {generateMutation.error instanceof Error
            ? generateMutation.error.message
            : "Could not generate PDF"}
        </p>
      ) : null}

      {result?.missing.length ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Not filled: {result.missing.join(", ")}. Empty values were used.
        </p>
      ) : null}

      {result?.warning ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">{result.warning}</p>
      ) : null}

      <Button
        type="button"
        className={settingsPrimaryButtonClassName}
        disabled={!template || generateMutation.isPending || templateQuery.isFetching}
        onClick={() => generateMutation.mutate()}
      >
        <FileDown className="size-4" aria-hidden />
        Generate PDF
      </Button>

      {result ? (
        <div className="space-y-2">
          <iframe
            title="Generated PDF preview"
            src={result.url}
            className="h-[28rem] w-full rounded-lg border bg-white"
          />
          <Button asChild variant="outline" size="sm">
            <a href={result.url} download={`${template?.name || "template"}.pdf`}>
              Download PDF
            </a>
          </Button>
        </div>
      ) : null}
    </div>
  )

  if (bare) {
    return <div className={className}>{content}</div>
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>API tester</CardTitle>
        <CardDescription>
          Pick a template, fill its variables (text and images), then generate a PDF
          exactly like the API would.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
