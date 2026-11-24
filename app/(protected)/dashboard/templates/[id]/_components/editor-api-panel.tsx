"use client"

import { Check, Copy } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { PanelSection } from "@/app/(protected)/dashboard/templates/[id]/_components/editor-fields"
import { Button } from "@/components/ui/button"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import {
  buildExamplePayload,
  extractTemplateVariables,
} from "@/lib/templates/variables"
import type { TemplateDesign } from "@/schemas/templates/design"

type EditorApiPanelProps = {
  templateId: string
  design: TemplateDesign
  apiBaseUrl: string
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      aria-label={label}
      onClick={async () => {
        if (await copyToClipboard(text)) {
          setCopied(true)
          timeoutRef.current = setTimeout(() => setCopied(false), 1600)
        }
      }}
    >
      {copied ? (
        <Check className="size-3.5 text-brand-teal" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

function Snippet({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-brand-navy p-3 text-[11px] leading-relaxed text-brand-mist">
      {code}
    </pre>
  )
}

export function EditorApiPanel({ templateId, design, apiBaseUrl }: EditorApiPanelProps) {
  const variables = extractTemplateVariables(design)
  const hasVariables = variables.text.length + variables.images.length > 0
  const endpoint = `${apiBaseUrl}/api/v1/templates/${templateId}/generate`
  const examplePayload = buildExamplePayload(variables)
  const payloadJson = JSON.stringify({ payload: examplePayload }, null, 2)

  const jsonCurl = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer pdf_sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ payload: examplePayload })}' \\
  --output result.pdf`

  const formFields = [
    ...variables.text.map((name) => `  -F "${name}=${examplePayload[name]}" \\`),
    ...variables.images.map((name) => `  -F "${name}=@/path/to/${name}.jpg" \\`),
  ].join("\n")

  const multipartCurl = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer pdf_sk_live_..." \\
${formFields ? `${formFields}\n` : ""}  --output result.pdf`

  return (
    <div>
      <PanelSection title="Variables">
        {hasVariables ? (
          <div className="space-y-2">
            {variables.text.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {variables.text.map((name) => (
                  <code
                    key={name}
                    className="rounded-md bg-brand-teal/10 px-1.5 py-0.5 text-xs text-brand-text-heading"
                  >
                    {name}
                  </code>
                ))}
              </div>
            ) : null}
            {variables.images.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {variables.images.map((name) => (
                  <code
                    key={name}
                    className="rounded-md bg-brand-mist px-1.5 py-0.5 text-xs text-brand-text-heading"
                  >
                    {name} · image
                  </code>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No variables yet. Type <code>{"{{name}}"}</code> inside a text box, or bind an
            image to a variable, and they will appear here.
          </p>
        )}
      </PanelSection>

      <PanelSection
        title="Endpoint"
        action={<CopyButton text={endpoint} label="Copy endpoint URL" />}
      >
        <code className="block break-all rounded-md bg-muted px-2 py-1.5 text-[11px]">
          POST {endpoint}
        </code>
        <p className="text-xs text-muted-foreground">
          Authenticate with an API key from{" "}
          <Link
            href={dashboardRoutes.settings.apiKeys}
            className="text-brand-teal underline-offset-4 hover:underline"
          >
            Settings → API Keys
          </Link>
          . The response is the PDF file. Add <code>?inline=1</code> to display instead of
          download.
        </p>
      </PanelSection>

      <PanelSection
        title="JSON payload"
        action={<CopyButton text={payloadJson} label="Copy JSON payload" />}
      >
        <Snippet code={payloadJson} />
        <p className="text-xs text-muted-foreground">
          Image variables accept a public URL or a <code>data:</code> URI.
        </p>
      </PanelSection>

      <PanelSection title="cURL · JSON" action={<CopyButton text={jsonCurl} label="Copy cURL" />}>
        <Snippet code={jsonCurl} />
      </PanelSection>

      <PanelSection
        title="cURL · form-data with files"
        action={<CopyButton text={multipartCurl} label="Copy multipart cURL" />}
      >
        <Snippet code={multipartCurl} />
        <p className="text-xs text-muted-foreground">
          Text fields fill text variables, file fields fill image variables (PNG or JPEG).
        </p>
      </PanelSection>
    </div>
  )
}
