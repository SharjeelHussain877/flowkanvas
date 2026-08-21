"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { FileDown, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

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
import type { CanvaTemplateDetail } from "@/schemas/canva/template-detail"
import type {
  CanvaTemplateListItem,
  CanvaTemplatesApiResponse,
} from "@/schemas/canva/templates"
import { cn } from "@/lib/utils"

type PdfPlaygroundProps = {
  initialTemplate?: CanvaTemplateDetail | null
  className?: string
}

function payloadValueToString(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (value && typeof value === "object" && "text" in value) {
    return String((value as { text?: unknown }).text ?? "")
  }

  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

function valuesFromTemplate(template: CanvaTemplateDetail | null) {
  if (!template) {
    return {} as Record<string, string>
  }

  return Object.fromEntries(
    template.fields.map((field) => [
      field.key,
      payloadValueToString(template.examplePayload[field.key]),
    ])
  )
}

function templateSelectValue(kind: string, id: string) {
  return `${kind}::${id}`
}

function parseTemplateSelectValue(value: string) {
  const [kind, ...idParts] = value.split("::")
  return { kind, id: idParts.join("::") }
}

async function generatePdfRequest(
  templateId: string,
  kind: string | undefined,
  payload: Record<string, string>
) {
  const params = new URLSearchParams()
  if (kind) {
    params.set("kind", kind)
  }

  const query = params.size > 0 ? `?${params.toString()}` : ""
  const response = await fetch(`/api/canva/templates/${templateId}/generate${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, kind }),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "PDF generation failed")
  }

  const warning = response.headers.get("X-Flowkanvas-Warning")
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  return { url, warning }
}

export function PdfPlayground({
  initialTemplate = null,
  className,
}: PdfPlaygroundProps) {
  const [selectedId, setSelectedId] = useState(initialTemplate?.id ?? "")
  const [selectedKind, setSelectedKind] = useState(initialTemplate?.kind ?? "")
  const [values, setValues] = useState<Record<string, string>>(
    valuesFromTemplate(initialTemplate)
  )
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const templatesQuery = useQuery({
    queryKey: queryKeys.canva.templates(),
    queryFn: () => apiClient<CanvaTemplatesApiResponse>("/api/canva/templates"),
    enabled: !initialTemplate,
    select: (response) => response.data,
  })

  const templateQuery = useQuery({
    queryKey: [...queryKeys.canva.templates(), "detail", selectedId, selectedKind],
    queryFn: () =>
      apiClient<{ data: CanvaTemplateDetail }>(
        `/api/canva/templates/${selectedId}?kind=${selectedKind}`
      ),
    enabled: Boolean(selectedId) && Boolean(selectedKind) && !initialTemplate,
    select: (response) => response.data,
  })

  const template = initialTemplate ?? templateQuery.data ?? null
  const templates: CanvaTemplateListItem[] = templatesQuery.data?.items ?? []
  const examplePayloadJson = template
    ? JSON.stringify(template.examplePayload, null, 2)
    : ""

  useEffect(() => {
    if (initialTemplate) {
      setValues(valuesFromTemplate(initialTemplate))
      return
    }

    if (templateQuery.data) {
      setValues(valuesFromTemplate(templateQuery.data))
    }
  }, [initialTemplate, templateQuery.data])

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const generateMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: () => {
      if (!template) {
        throw new Error("Select a template first")
      }

      return generatePdfRequest(template.id, template.kind, values)
    },
    onSuccess: (result) => {
      setPdfUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current)
        }
        return result.url
      })
      setWarning(result.warning)
    },
  })

  const fieldKeys = useMemo(
    () => template?.fields.map((field) => field.key) ?? [],
    [template]
  )

  const selectedValue =
    selectedId && selectedKind ? templateSelectValue(selectedKind, selectedId) : ""

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>API tester</CardTitle>
        <CardDescription>
          Select a template, fill its payload, then generate a PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {initialTemplate ? null : (
          <Field>
            <FieldLabel htmlFor="playground-template">Template</FieldLabel>
            <Select
              value={selectedValue || undefined}
              onValueChange={(value) => {
                const parsed = parseTemplateSelectValue(value)
                setSelectedKind(parsed.kind)
                setSelectedId(parsed.id)
                setPdfUrl(null)
                setWarning(null)
                setValues({})
              }}
            >
              <SelectTrigger
                id="playground-template"
                className="h-11 w-full min-w-0 rounded-sm border border-brand-input-border bg-brand-input px-3 py-7 text-base text-brand-text-heading md:text-sm"
              >
                <SelectValue placeholder="Select a Canva template" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
                className="w-(--radix-select-trigger-width) max-h-60"
              >
                {templates.map((item) => (
                  <SelectItem
                    key={`${item.kind}-${item.id}`}
                    value={templateSelectValue(item.kind, item.id)}
                  >
                    {item.title} ({item.kind === "brand_template" ? "brand" : "design"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {selectedId && templateQuery.isFetching ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading payload...
          </div>
        ) : null}

        {template && fieldKeys.length === 0 && !templateQuery.isFetching ? (
          <p className="text-sm text-muted-foreground">
            No payload variables found on this template. You can still export the
            original PDF.
          </p>
        ) : null}

        {fieldKeys.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-3">
              {fieldKeys.map((key) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`payload-${key}`}>{key}</FieldLabel>
                  <Input
                    id={`payload-${key}`}
                    value={values[key] ?? ""}
                    placeholder={`Value for ${key}`}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </Field>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Payload</p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
                {JSON.stringify(
                  Object.fromEntries(
                    fieldKeys.map((key) => [
                      key,
                      {
                        type: "text",
                        text: values[key] ?? "",
                      },
                    ])
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        ) : template && examplePayloadJson !== "{}" ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Payload</p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
              {examplePayloadJson}
            </pre>
          </div>
        ) : null}

        {generateMutation.isError ? (
          <p className="text-sm text-destructive">
            {generateMutation.error instanceof Error
              ? generateMutation.error.message
              : "Could not generate PDF"}
          </p>
        ) : null}

        {warning ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">{warning}</p>
        ) : null}

        <Button
          type="button"
          className={settingsPrimaryButtonClassName}
          disabled={!template || generateMutation.isPending || templateQuery.isFetching}
          onClick={() => generateMutation.mutate()}
        >
          {generateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <FileDown className="size-4" aria-hidden />
          )}
          {generateMutation.isPending ? "Generating PDF..." : "Generate PDF"}
        </Button>

        {pdfUrl ? (
          <div className="space-y-2">
            <iframe
              title="Generated PDF preview"
              src={pdfUrl}
              className="h-[28rem] w-full rounded-lg border"
            />
            <Button asChild variant="outline" size="sm">
              <a href={pdfUrl} download={`${template?.title || "canva-template"}.pdf`}>
                Download PDF
              </a>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
