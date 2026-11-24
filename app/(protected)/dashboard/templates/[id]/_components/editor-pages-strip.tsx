"use client"

import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from "lucide-react"
import type { Dispatch } from "react"

import type { EditorAction } from "@/app/(protected)/dashboard/templates/[id]/_components/use-editor-state"
import { DesignPreview } from "@/components/templates/design-renderer"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MAX_PAGES, type TemplateDesign } from "@/schemas/templates/design"
import { cn } from "@/lib/utils"

type EditorPagesStripProps = {
  design: TemplateDesign
  activePageId: string
  dispatch: Dispatch<EditorAction>
}

function StripButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

/** Page thumbnails under the canvas: switch, add, duplicate, reorder and delete pages. */
export function EditorPagesStrip({ design, activePageId, dispatch }: EditorPagesStripProps) {
  const activeIndex = Math.max(
    0,
    design.pages.findIndex((page) => page.id === activePageId)
  )
  const thumbHeight = 64
  const thumbWidth = Math.max(32, Math.min(120, (design.width / design.height) * thumbHeight))

  return (
    <div className="flex h-24 shrink-0 items-center gap-3 border-t border-border/70 bg-card px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2">
        {design.pages.map((page, index) => (
          <button
            key={page.id}
            type="button"
            aria-label={`Page ${index + 1}`}
            aria-current={page.id === activePageId}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1 rounded-md p-1 transition-colors",
              page.id === activePageId ? "bg-brand-teal/10" : "hover:bg-brand-mist/60"
            )}
            onClick={() => dispatch({ type: "set-active-page", id: page.id })}
          >
            <div
              className={cn(
                "overflow-hidden rounded-sm ring-1",
                page.id === activePageId ? "ring-brand-teal" : "ring-border"
              )}
              style={{ width: thumbWidth, height: thumbHeight }}
            >
              <DesignPreview
                design={design}
                pageIndex={index}
                highlightVariables={false}
                className="h-full w-full"
              />
            </div>
            <span className="text-[10px] tabular-nums text-brand-text-muted">{index + 1}</span>
          </button>
        ))}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Add page"
              disabled={design.pages.length >= MAX_PAGES}
              className="flex shrink-0 items-center justify-center rounded-sm border border-dashed border-brand-slate/60 text-brand-slate transition-colors hover:border-brand-teal hover:text-brand-teal disabled:opacity-40"
              style={{ width: thumbWidth, height: thumbHeight }}
              onClick={() => dispatch({ type: "add-page" })}
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {design.pages.length >= MAX_PAGES ? `Up to ${MAX_PAGES} pages` : "Add page"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 border-s border-border/70 ps-2">
        <span className="me-1 text-xs tabular-nums text-brand-text-muted">
          Page {activeIndex + 1} of {design.pages.length}
        </span>
        <StripButton
          label="Move page left"
          icon={<ChevronLeft className="size-4" aria-hidden />}
          disabled={activeIndex === 0}
          onClick={() => dispatch({ type: "move-page", id: activePageId, direction: "left" })}
        />
        <StripButton
          label="Move page right"
          icon={<ChevronRight className="size-4" aria-hidden />}
          disabled={activeIndex >= design.pages.length - 1}
          onClick={() => dispatch({ type: "move-page", id: activePageId, direction: "right" })}
        />
        <StripButton
          label="Duplicate page"
          icon={<Copy className="size-4" aria-hidden />}
          disabled={design.pages.length >= MAX_PAGES}
          onClick={() => dispatch({ type: "duplicate-page", id: activePageId })}
        />
        <StripButton
          label="Delete page"
          icon={<Trash2 className="size-4" aria-hidden />}
          disabled={design.pages.length <= 1}
          onClick={() => dispatch({ type: "remove-page", id: activePageId })}
        />
      </div>
    </div>
  )
}
