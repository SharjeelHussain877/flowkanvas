"use client"

import { Check, Copy, ExternalLink, LayoutTemplate } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CanvaTemplateDetail } from "@/schemas/canva/template-detail"

type TemplatePayloadViewProps = {
  template: CanvaTemplateDetail
}

export function TemplatePayloadView({ template }: TemplatePayloadViewProps) {
  const [copied, setCopied] = useState(false)
  const payloadJson = JSON.stringify(template.examplePayload, null, 2)

  async function copyPayload() {
    await navigator.clipboard.writeText(payloadJson)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-brand-surface">
        <div className="relative min-h-[16rem] flex-1">
          {template.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={template.thumbnailUrl}
              alt={template.title}
              className="absolute inset-0 h-full w-full object-contain p-3"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-brand-slate">
              <LayoutTemplate className="size-8 opacity-40" aria-hidden />
            </div>
          )}
        </div>
        {template.viewUrl ? (
          <div className="border-t p-3">
            <Button asChild variant="outline" size="sm">
              <a href={template.viewUrl} target="_blank" rel="noreferrer">
                Open in Canva
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        ) : null}
      </div>

      <Card className="flex min-h-0 flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle>Example payload</CardTitle>
            <CardDescription>
              Send this object as the Canva autofill <code>data</code> body.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyPayload()}
            disabled={template.fields.length === 0}
          >
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </CardHeader>
        <CardContent className="min-h-0 flex-1">
          <pre className="h-full min-h-[16rem] overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
            {payloadJson}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
