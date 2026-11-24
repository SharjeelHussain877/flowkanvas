"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Braces,
  FlaskConical,
  ImagePlus,
  Minus,
  Plus,
  Redo2,
  Save,
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
import { EditorPropertiesPanel } from "@/app/(protected)/dashboard/templates/[id]/_components/editor-properties-panel"
import { useEditorState } from "@/app/(protected)/dashboard/templates/[id]/_components/use-editor-state"
import { settingsPrimaryButtonClassName } from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
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
import {
  createImageElement,
  createRectElement,
  createTextElement,
  createVariableTextElement,
} from "@/lib/templates/element-defaults"
import type { TemplateDesign } from "@/schemas/templates/design"
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
          aria-label={label}
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
  const nameInputRef = useRef<HTMLInputElement>(null)

  const designJson = useMemo(() => JSON.stringify(state.design), [state.design])
  const savedDesignJson = useMemo(
    () => JSON.stringify(savedTemplate.design),
    [savedTemplate.design]
  )
  const trimmedName = name.trim()
  const nameValid = templateNameField.safeParse(trimmedName).success
  const isDirty = designJson !== savedDesignJson || trimmedName !== savedTemplate.name

  const selectedElement =
    state.design.elements.find((element) => element.id === state.selectedId) ?? null

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

      if (mod && key === "d" && state.selectedId) {
        event.preventDefault()
        dispatch({ type: "duplicate-element", id: state.selectedId })
        return
      }

      if (!state.selectedId) {
        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        dispatch({ type: "remove-element", id: state.selectedId })
        return
      }

      if (event.key === "Escape") {
        dispatch({ type: "select", id: null })
        return
      }

      const step = event.shiftKey ? 10 : 1
      const element = state.design.elements.find((item) => item.id === state.selectedId)

      if (!element) {
        return
      }

      const nudges: Record<string, { x?: number; y?: number }> = {
        ArrowLeft: { x: element.x - step },
        ArrowRight: { x: element.x + step },
        ArrowUp: { y: element.y - step },
        ArrowDown: { y: element.y + step },
      }

      const patch = nudges[event.key]

      if (patch) {
        event.preventDefault()
        dispatch({ type: "update-element", id: element.id, patch })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [dispatch, save, state.design.elements, state.selectedId])

  const handleEffectiveZoom = useCallback((value: number) => {
    setEffectiveZoom((current) => (Math.abs(current - value) < 0.0001 ? current : value))
  }, [])

  function addElement(kind: "text" | "variable" | "image" | "rect") {
    const element =
      kind === "text"
        ? createTextElement(state.design)
        : kind === "variable"
          ? createVariableTextElement(state.design)
          : kind === "image"
            ? createImageElement(state.design)
            : createRectElement(state.design)

    dispatch({ type: "add-element", element })
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

  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col bg-brand-mist/60">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-card px-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to templates">
          <Link href={dashboardRoutes.templates}>
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>

        <Input
          ref={nameInputRef}
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
        <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-e border-border/70 bg-card py-2">
          <ToolButton label="Add text" icon={<Type className="size-5" aria-hidden />} onClick={() => addElement("text")} />
          <ToolButton label="Add variable text" icon={<Braces className="size-5" aria-hidden />} onClick={() => addElement("variable")} />
          <ToolButton label="Add image" icon={<ImagePlus className="size-5" aria-hidden />} onClick={() => addElement("image")} />
          <ToolButton label="Add rectangle" icon={<Square className="size-5" aria-hidden />} onClick={() => addElement("rect")} />
        </aside>

        <EditorCanvas
          design={state.design}
          selectedId={state.selectedId}
          zoom={zoom}
          onEffectiveZoom={handleEffectiveZoom}
          editingId={editingId}
          onEditingChange={setEditingId}
          onSelect={(id) => dispatch({ type: "select", id })}
          onUpdateElement={(id, patch, transient) =>
            dispatch({ type: "update-element", id, patch, transient })
          }
          onBeginTransaction={() => dispatch({ type: "begin-transaction" })}
          onEndTransaction={() => dispatch({ type: "end-transaction" })}
        />

        <aside className="hidden w-80 shrink-0 flex-col border-s border-border/70 bg-card lg:flex">
          <div className="flex shrink-0 border-b border-border/70" role="tablist">
            {(
              [
                { id: "design", label: selectedElement ? "Element" : "Page" },
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
                element={selectedElement}
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
