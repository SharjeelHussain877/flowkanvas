"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Barcode,
  Braces,
  Circle,
  FlaskConical,
  ImagePlus,
  Minus,
  Plus,
  QrCode,
  Redo2,
  Save,
  Slash,
  Sparkles,
  Square,
  Type,
  Undo2,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { EditorApiPanel } from "@/app/(protected)/dashboard/templates/[id]/_components/editor-api-panel"
import {
  clampZoom,
  EditorCanvas,
} from "@/app/(protected)/dashboard/templates/[id]/_components/editor-canvas"
import { EditorPagesStrip } from "@/app/(protected)/dashboard/templates/[id]/_components/editor-pages-strip"
import { EditorPropertiesPanel } from "@/app/(protected)/dashboard/templates/[id]/_components/editor-properties-panel"
import { useEditorState } from "@/app/(protected)/dashboard/templates/[id]/_components/use-editor-state"
import { settingsPrimaryButtonClassName } from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
import { FontFaces } from "@/components/templates/font-faces"
import { PdfPlayground } from "@/components/templates/pdf-playground"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { apiClient } from "@/lib/api/client"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { queryKeys } from "@/lib/query/keys"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import { findPage } from "@/lib/templates/design"
import {
  createElementForTool,
  duplicateElements,
  type ToolKind,
} from "@/lib/templates/element-defaults"
import type { DesignElement, TemplateDesign } from "@/schemas/templates/design"
import {
  templateNameField,
  type TemplateApiResponse,
  type TemplateRecord,
  type TemplatesListResponse,
} from "@/schemas/templates/template"
import { cn } from "@/lib/utils"

type TemplateEditorProps = {
  initialTemplate: TemplateRecord
  apiBaseUrl: string
}

type PanelTab = "design" | "api"

const ZOOM_STEP = 1.25

const TOOLS: Array<{ kind: ToolKind; label: string; icon: React.ReactNode }> = [
  { kind: "text", label: "Text", icon: <Type className="size-5" aria-hidden /> },
  { kind: "variable", label: "Variable text", icon: <Braces className="size-5" aria-hidden /> },
  { kind: "image", label: "Image", icon: <ImagePlus className="size-5" aria-hidden /> },
  { kind: "rect", label: "Rectangle", icon: <Square className="size-5" aria-hidden /> },
  { kind: "ellipse", label: "Ellipse / circle", icon: <Circle className="size-5" aria-hidden /> },
  { kind: "line", label: "Line", icon: <Slash className="size-5" aria-hidden /> },
  { kind: "icon", label: "Icon", icon: <Sparkles className="size-5" aria-hidden /> },
  { kind: "qrcode", label: "QR code", icon: <QrCode className="size-5" aria-hidden /> },
  { kind: "barcode", label: "Barcode", icon: <Barcode className="size-5" aria-hidden /> },
]

function ToolButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={`Add ${label.toLowerCase()}`}
          className="text-brand-text-muted hover:text-brand-text-heading"
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function TemplateEditor({ initialTemplate, apiBaseUrl }: TemplateEditorProps) {
  const queryClient = useQueryClient()
  const [state, dispatch] = useEditorState(initialTemplate.design)
  const [name, setName] = useState(initialTemplate.name)
  const [savedTemplate, setSavedTemplate] = useState(initialTemplate)
  const [zoom, setZoom] = useState<number | null>(null)
  const [effectiveZoom, setEffectiveZoom] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [panelTab, setPanelTab] = useState<PanelTab>("design")
  const [testOpen, setTestOpen] = useState(false)
  const clipboardRef = useRef<DesignElement[]>([])

  const designJson = useMemo(() => JSON.stringify(state.design), [state.design])
  const savedDesignJson = useMemo(
    () => JSON.stringify(savedTemplate.design),
    [savedTemplate.design]
  )
  const trimmedName = name.trim()
  const nameValid = templateNameField.safeParse(trimmedName).success
  const isDirty = designJson !== savedDesignJson || trimmedName !== savedTemplate.name

  const activePage = findPage(state.design, state.activePageId) ?? state.design.pages[0]
  const selectedElements = activePage.elements.filter((element) =>
    state.selectedIds.includes(element.id)
  )

  const saveMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (input: { name: string; design: TemplateDesign }) =>
      apiClient<TemplateApiResponse>(`/api/templates/${initialTemplate.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (response) => {
      setSavedTemplate(response.data)
      setName(response.data.name)
      queryClient.setQueryData<TemplateApiResponse>(
        queryKeys.templates.detail(response.data.id),
        response
      )
      queryClient.setQueryData<TemplatesListResponse>(
        queryKeys.templates.list(),
        (current) =>
          current
            ? {
                data: [
                  response.data,
                  ...current.data.filter((item) => item.id !== response.data.id),
                ],
              }
            : current
      )
    },
  })

  const save = useCallback(() => {
    if (!isDirty || !nameValid || saveMutation.isPending) {
      return
    }

    saveMutation.mutate({ name: trimmedName, design: state.design })
  }, [isDirty, nameValid, saveMutation, state.design, trimmedName])

  useEffect(() => {
    if (!isDirty) {
      return
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (mod && key === "s") {
        event.preventDefault()
        save()
        return
      }

      if (isTyping) {
        return
      }

      if (mod && key === "z") {
        event.preventDefault()
        dispatch({ type: event.shiftKey ? "redo" : "undo" })
        return
      }

      if (mod && key === "a") {
        event.preventDefault()
        dispatch({ type: "select", ids: activePage.elements.map((element) => element.id) })
        return
      }

      if (mod && key === "v") {
        if (clipboardRef.current.length > 0) {
          event.preventDefault()
          dispatch({ type: "add-elements", elements: duplicateElements(clipboardRef.current) })
        }
        return
      }

      if (state.selectedIds.length === 0) {
        return
      }

      const ids = state.selectedIds

      if (mod && key === "d") {
        event.preventDefault()
        dispatch({ type: "duplicate-elements", ids })
        return
      }

      if (mod && key === "c") {
        event.preventDefault()
        clipboardRef.current = selectedElements
        return
      }

      if (mod && key === "g") {
        event.preventDefault()
        dispatch({ type: event.shiftKey ? "ungroup-elements" : "group-elements", ids })
        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        dispatch({ type: "remove-elements", ids })
        return
      }

      if (event.key === "Escape") {
        dispatch({ type: "select", ids: [] })
        return
      }

      const step = event.shiftKey ? 10 : 1
      const nudges: Record<string, { dx: number; dy: number }> = {
        ArrowLeft: { dx: -step, dy: 0 },
        ArrowRight: { dx: step, dy: 0 },
        ArrowUp: { dx: 0, dy: -step },
        ArrowDown: { dx: 0, dy: step },
      }

      const nudge = nudges[event.key]

      if (nudge) {
        event.preventDefault()
        dispatch({ type: "translate-elements", ids, ...nudge })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activePage.elements, dispatch, save, selectedElements, state.selectedIds])

  const handleEffectiveZoom = useCallback((value: number) => {
    setEffectiveZoom((current) => (Math.abs(current - value) < 0.0001 ? current : value))
  }, [])

  function addElement(kind: ToolKind) {
    const element = createElementForTool(state.design, kind)

    dispatch({ type: "add-elements", elements: [element] })
    setPanelTab("design")

    if (kind === "text" || kind === "variable") {
      setEditingId(element.id)
    }
  }

  const statusLabel = saveMutation.isPending
    ? "Saving..."
    : saveMutation.isError
      ? "Save failed"
      : isDirty
        ? "Unsaved changes"
        : "Saved"

  const panelTitle =
    selectedElements.length === 0
      ? "Page"
      : selectedElements.length === 1
        ? "Element"
        : "Selection"

  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col bg-brand-mist/60">
      <FontFaces />

      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-card px-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to templates">
          <Link href={dashboardRoutes.templates}>
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>

        <Input
          value={name}
          aria-label="Template name"
          aria-invalid={!nameValid}
          className="h-9 w-56 px-2.5 py-0 text-sm font-medium"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }
          }}
        />

        <span
          className={cn(
            "hidden text-xs sm:inline",
            saveMutation.isError
              ? "text-destructive"
              : isDirty
                ? "text-amber-700 dark:text-amber-300"
                : "text-muted-foreground"
          )}
        >
          {statusLabel}
        </span>

        <div className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Undo"
            title="Undo (⌘Z)"
            disabled={state.past.length === 0}
            onClick={() => dispatch({ type: "undo" })}
          >
            <Undo2 className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Redo"
            title="Redo (⌘⇧Z)"
            disabled={state.future.length === 0}
            onClick={() => dispatch({ type: "redo" })}
          >
            <Redo2 className="size-4" aria-hidden />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            onClick={() => setZoom(clampZoom(effectiveZoom / ZOOM_STEP))}
          >
            <Minus className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-14 tabular-nums"
            title="Fit to screen"
            onClick={() => setZoom(null)}
          >
            {Math.round(effectiveZoom * 100)}%
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            onClick={() => setZoom(clampZoom(effectiveZoom * ZOOM_STEP))}
          >
            <Plus className="size-4" aria-hidden />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isDirty}
                  onClick={() => setTestOpen(true)}
                >
                  <FlaskConical className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Test API</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isDirty ? "Save first to test the latest changes" : "Generate a PDF from this template"}
            </TooltipContent>
          </Tooltip>

          <Button
            type="button"
            size="lg"
            className={cn(settingsPrimaryButtonClassName, "h-9")}
            disabled={!isDirty || !nameValid || saveMutation.isPending}
            onClick={save}
          >
            <Save className="size-4" aria-hidden />
            Save
          </Button>
        </div>
      </header>

      {saveMutation.isError ? (
        <p className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Could not save template"}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto border-e border-border/70 bg-card py-2">
          {TOOLS.map((tool) => (
            <ToolButton
              key={tool.kind}
              label={tool.label}
              icon={tool.icon}
              onClick={() => addElement(tool.kind)}
            />
          ))}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorCanvas
            design={state.design}
            page={activePage}
            selectedIds={state.selectedIds}
            zoom={zoom}
            onEffectiveZoom={handleEffectiveZoom}
            editingId={editingId}
            onEditingChange={setEditingId}
            onSelect={(ids) => dispatch({ type: "select", ids })}
            onUpdateElement={(id, patch, transient) =>
              dispatch({ type: "update-element", id, patch, transient })
            }
            onPatchElements={(patches, transient) =>
              dispatch({ type: "patch-elements", patches, transient })
            }
            onBeginTransaction={() => dispatch({ type: "begin-transaction" })}
            onEndTransaction={() => dispatch({ type: "end-transaction" })}
          />
          <EditorPagesStrip
            design={state.design}
            activePageId={activePage.id}
            dispatch={dispatch}
          />
        </div>

        <aside className="hidden w-80 shrink-0 flex-col border-s border-border/70 bg-card lg:flex">
          <div className="flex shrink-0 border-b border-border/70" role="tablist">
            {(
              [
                { id: "design", label: panelTitle },
                { id: "api", label: "API" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={panelTab === tab.id}
                className={cn(
                  "flex-1 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  panelTab === tab.id
                    ? "border-brand-teal text-brand-text-heading"
                    : "border-transparent text-brand-text-muted hover:text-brand-text-heading"
                )}
                onClick={() => setPanelTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {panelTab === "design" ? (
              <EditorPropertiesPanel
                design={state.design}
                page={activePage}
                elements={selectedElements}
                templateId={initialTemplate.id}
                dispatch={dispatch}
              />
            ) : (
              <EditorApiPanel
                templateId={initialTemplate.id}
                design={state.design}
                apiBaseUrl={apiBaseUrl}
              />
            )}
          </div>
        </aside>
      </div>

      <Sheet open={testOpen} onOpenChange={setTestOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Test &ldquo;{savedTemplate.name}&rdquo;</SheetTitle>
            <SheetDescription>
              Fill the variables and generate a PDF the same way the API does. Uses the last
              saved version.
            </SheetDescription>
          </SheetHeader>
          <PdfPlayground initialTemplate={savedTemplate} bare className="px-4 pb-6" />
        </SheetContent>
      </Sheet>
    </div>
  )
}
