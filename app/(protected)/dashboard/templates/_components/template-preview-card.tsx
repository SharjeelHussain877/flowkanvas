"use client"

import { Braces, Layers, Trash2 } from "lucide-react"
import Link from "next/link"

import { DesignPreview } from "@/components/templates/design-renderer"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { findPresetBySize } from "@/lib/templates/presets"
import { countVariables, extractTemplateVariables } from "@/lib/templates/variables"
import type { TemplateRecord } from "@/schemas/templates/template"
import { cn } from "@/lib/utils"

type TemplatePreviewCardProps = {
  template: TemplateRecord
  onDelete: () => void
  className?: string
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function TemplatePreviewCard({
  template,
  onDelete,
  className,
}: TemplatePreviewCardProps) {
  const variables = extractTemplateVariables(template.design)
  const variableCount = countVariables(variables)
  const pageCount = template.design.pages.length
  const preset = findPresetBySize(template.width, template.height)
  const sizeLabel = preset
    ? preset.label
    : `${template.width} × ${template.height} px`

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <Link
        href={dashboardRoutes.template(template.id)}
        aria-label={`Open ${template.name} in the editor`}
        className="block"
      >
        <div className="aspect-[3/4] w-full bg-brand-mist/40 p-3">
          <DesignPreview design={template.design} className="h-full w-full" />
        </div>
      </Link>

      <div className="flex items-start justify-between gap-2 px-3 py-3">
        <div className="min-w-0">
          <Link
            href={dashboardRoutes.template(template.id)}
            className="line-clamp-1 text-sm font-medium text-brand-text-heading hover:underline"
          >
            {template.name}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {sizeLabel}
            {pageCount > 1 ? ` · ${pageCount} pages` : ""} · {formatUpdatedAt(template.updated_at)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {pageCount > 1 ? (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              title={`${pageCount} pages`}
            >
              <Layers className="size-3" aria-hidden />
              {pageCount}
            </span>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                <Braces className="size-3" aria-hidden />
                {variableCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {variableCount === 0
                ? "No variables yet"
                : [...variables.text, ...variables.images, ...variables.conditions].join(", ")}
            </TooltipContent>
          </Tooltip>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${template.name}`}
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
