"use client"

import { useMutation } from "@tanstack/react-query"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Bold,
  Copy,
  ImageUp,
  Italic,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useRef, type Dispatch } from "react"

import {
  ColorField,
  NumberField,
  PanelSection,
  ToggleGroup,
  compactInputClassName,
  type TransactionHandlers,
} from "@/app/(protected)/dashboard/templates/[id]/_components/editor-fields"
import type {
  EditorAction,
  ElementPatch,
} from "@/app/(protected)/dashboard/templates/[id]/_components/use-editor-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import { fontOptions } from "@/lib/templates/fonts"
import {
  CUSTOM_PRESET_ID,
  findPresetBySize,
  pageSizePresets,
} from "@/lib/templates/presets"
import {
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  TEMPLATE_VARIABLE_NAME_PATTERN,
  type DesignElement,
  type FontFamily,
  type ImageElement,
  type ImageFit,
  type RectElement,
  type TemplateDesign,
  type TextAlign,
  type TextElement,
  type VerticalAlign,
} from "@/schemas/templates/design"
import type { TemplateAssetUploadResponse } from "@/schemas/templates/template"

type EditorPropertiesPanelProps = {
  design: TemplateDesign
  element: DesignElement | null
  templateId: string
  dispatch: Dispatch<EditorAction>
}

const selectTriggerClassName =
  "h-9 w-full min-w-0 rounded-sm border border-brand-input-border bg-brand-input px-2.5 text-sm text-brand-text-heading"

function VerticalAlignIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-3.5" aria-hidden />
}

function sanitizeVariableName(raw: string): string {
  return raw.trim().replace(/[^A-Za-z0-9_]/g, "_").replace(/^(\d)/, "_$1")
}

export function EditorPropertiesPanel({
  design,
  element,
  templateId,
  dispatch,
}: EditorPropertiesPanelProps) {
  const transaction: TransactionHandlers = {
    onFocus: () => dispatch({ type: "begin-transaction" }),
    onBlur: () => dispatch({ type: "end-transaction" }),
  }

  if (!element) {
    return <PageProperties design={design} dispatch={dispatch} transaction={transaction} />
  }

  const update = (patch: ElementPatch) =>
    dispatch({ type: "update-element", id: element.id, patch })

  return (
    <div>
      <PanelSection
        title={element.type === "text" ? "Text" : element.type === "image" ? "Image" : "Shape"}
        action={
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Duplicate"
              title="Duplicate (⌘D)"
              onClick={() => dispatch({ type: "duplicate-element", id: element.id })}
            >
              <Copy className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Delete"
              title="Delete (⌫)"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => dispatch({ type: "remove-element", id: element.id })}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </div>
        }
      >
        {element.type === "text" ? (
          <TextProperties element={element} update={update} transaction={transaction} />
        ) : element.type === "image" ? (
          <ImageProperties
            element={element}
            templateId={templateId}
            update={update}
            transaction={transaction}
          />
        ) : (
          <RectProperties element={element} update={update} transaction={transaction} />
        )}
      </PanelSection>

      <PanelSection title="Position & size">
        <div className="grid grid-cols-2 gap-2">
          <NumberField id="el-x" label="X" value={element.x} onChange={(x) => update({ x })} transaction={transaction} />
          <NumberField id="el-y" label="Y" value={element.y} onChange={(y) => update({ y })} transaction={transaction} />
          <NumberField id="el-w" label="Width" min={1} value={element.width} onChange={(width) => update({ width })} transaction={transaction} />
          <NumberField id="el-h" label="Height" min={1} value={element.height} onChange={(height) => update({ height })} transaction={transaction} />
        </div>
      </PanelSection>

      <PanelSection title="Layer">
        <div className="grid grid-cols-4 gap-1">
          {(
            [
              { direction: "front", label: "Bring to front", icon: ArrowUpToLine },
              { direction: "forward", label: "Bring forward", icon: ArrowUp },
              { direction: "backward", label: "Send backward", icon: ArrowDown },
              { direction: "back", label: "Send to back", icon: ArrowDownToLine },
            ] as const
          ).map((item) => (
            <Button
              key={item.direction}
              type="button"
              size="sm"
              variant="outline"
              aria-label={item.label}
              title={item.label}
              onClick={() =>
                dispatch({ type: "reorder-element", id: element.id, direction: item.direction })
              }
            >
              <item.icon className="size-3.5" aria-hidden />
            </Button>
          ))}
        </div>
      </PanelSection>
    </div>
  )
}

function PageProperties({
  design,
  dispatch,
  transaction,
}: {
  design: TemplateDesign
  dispatch: Dispatch<EditorAction>
  transaction: TransactionHandlers
}) {
  const presetId = findPresetBySize(design.width, design.height)?.id ?? CUSTOM_PRESET_ID

  return (
    <div>
      <PanelSection title="Page">
        <div className="space-y-1">
          <Label htmlFor="page-preset" className="text-xs text-brand-text-muted">
            Size preset
          </Label>
          <Select
            value={presetId}
            onValueChange={(value) => {
              const preset = pageSizePresets.find((item) => item.id === value)

              if (preset) {
                dispatch({
                  type: "update-page",
                  patch: { width: preset.width, height: preset.height },
                })
              }
            }}
          >
            <SelectTrigger id="page-preset" className={selectTriggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="max-h-72">
              {pageSizePresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                  <span className="ms-2 text-xs text-muted-foreground">
                    {preset.width} × {preset.height}
                  </span>
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_PRESET_ID}>Custom size</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id="page-width"
            label="Width (px)"
            min={MIN_PAGE_SIZE}
            max={MAX_PAGE_SIZE}
            value={design.width}
            onChange={(width) => dispatch({ type: "update-page", patch: { width } })}
            transaction={transaction}
          />
          <NumberField
            id="page-height"
            label="Height (px)"
            min={MIN_PAGE_SIZE}
            max={MAX_PAGE_SIZE}
            value={design.height}
            onChange={(height) => dispatch({ type: "update-page", patch: { height } })}
            transaction={transaction}
          />
        </div>

        <ColorField
          id="page-background"
          label="Background"
          value={design.background}
          onChange={(background) => dispatch({ type: "update-page", patch: { background } })}
          transaction={transaction}
        />
      </PanelSection>

      <PanelSection title="Tips">
        <ul className="list-disc space-y-1 ps-4 text-xs text-muted-foreground">
          <li>Click an element to edit it here. Double-click text to type.</li>
          <li>
            Write <code>{"{{name}}"}</code> inside text to make it a variable.
          </li>
          <li>Bind an image to a variable to swap it per PDF via the API.</li>
          <li>Arrow keys nudge, ⇧ for 10px. ⌘Z / ⌘⇧Z undo and redo.</li>
        </ul>
      </PanelSection>
    </div>
  )
}

function TextProperties({
  element,
  update,
  transaction,
}: {
  element: TextElement
  update: (patch: ElementPatch) => void
  transaction: TransactionHandlers
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="text-content" className="text-xs text-brand-text-muted">
          Content
        </Label>
        <Textarea
          id="text-content"
          value={element.text}
          rows={3}
          className="min-h-16 text-sm"
          placeholder="Hello {{name}}"
          onChange={(event) => update({ text: event.target.value })}
          onFocus={transaction.onFocus}
          onBlur={transaction.onBlur}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_84px] gap-2">
        <div className="space-y-1">
          <Label htmlFor="text-font" className="text-xs text-brand-text-muted">
            Font
          </Label>
          <Select
            value={element.fontFamily}
            onValueChange={(value) => update({ fontFamily: value as FontFamily })}
          >
            <SelectTrigger id="text-font" className={selectTriggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {fontOptions.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.cssFamily }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumberField
          id="text-size"
          label="Size"
          min={4}
          max={400}
          value={element.fontSize}
          onChange={(fontSize) => update({ fontSize })}
          transaction={transaction}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <span className="text-xs text-brand-text-muted">Style</span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant={element.bold ? "secondary" : "outline"}
              aria-pressed={element.bold}
              aria-label="Bold"
              onClick={() => update({ bold: !element.bold })}
            >
              <Bold className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={element.italic ? "secondary" : "outline"}
              aria-pressed={element.italic}
              aria-label="Italic"
              onClick={() => update({ italic: !element.italic })}
            >
              <Italic className="size-3.5" aria-hidden />
            </Button>
          </div>
        </div>

        <ToggleGroup<TextAlign>
          label="Align"
          value={element.align}
          onChange={(align) => update({ align })}
          options={[
            { value: "left", label: "Align left", icon: <AlignLeft className="size-3.5" aria-hidden /> },
            { value: "center", label: "Align center", icon: <AlignCenter className="size-3.5" aria-hidden /> },
            { value: "right", label: "Align right", icon: <AlignRight className="size-3.5" aria-hidden /> },
          ]}
        />

        <ToggleGroup<VerticalAlign>
          label="Vertical"
          value={element.verticalAlign}
          onChange={(verticalAlign) => update({ verticalAlign })}
          options={[
            { value: "top", label: "Top", icon: <VerticalAlignIcon icon={ArrowUpToLine} /> },
            { value: "middle", label: "Middle", icon: <VerticalAlignIcon icon={AlignCenter} /> },
            { value: "bottom", label: "Bottom", icon: <VerticalAlignIcon icon={ArrowDownToLine} /> },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ColorField
          id="text-color"
          label="Color"
          value={element.color}
          onChange={(color) => update({ color })}
          transaction={transaction}
        />
        <NumberField
          id="text-line-height"
          label="Line height"
          min={0.5}
          max={3}
          step={0.1}
          value={element.lineHeight}
          onChange={(lineHeight) => update({ lineHeight })}
          transaction={transaction}
        />
      </div>
    </div>
  )
}

function ImageProperties({
  element,
  templateId,
  update,
  transaction,
}: {
  element: ImageElement
  templateId: string
  update: (patch: ElementPatch) => void
  transaction: TransactionHandlers
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("templateId", templateId)

      return apiClient<TemplateAssetUploadResponse>("/api/templates/assets", {
        method: "POST",
        body: formData,
      })
    },
    onSuccess: (response) => {
      update({ src: response.data.url })
    },
  })

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="text-xs text-brand-text-muted">Static image</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]

            if (file) {
              uploadMutation.mutate(file)
            }

            event.target.value = ""
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageUp className="size-3.5" aria-hidden />
            {element.src ? "Replace" : "Upload PNG / JPEG"}
          </Button>
          {element.src ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => update({ src: null })}
            >
              Remove
            </Button>
          ) : null}
        </div>
        {uploadMutation.isError ? (
          <p className="text-xs text-destructive">
            {uploadMutation.error instanceof Error
              ? uploadMutation.error.message
              : "Upload failed"}
          </p>
        ) : null}
        {element.src && element.variable ? (
          <p className="text-xs text-muted-foreground">
            Used as a placeholder when the API does not send{" "}
            <code>{element.variable}</code>.
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="image-variable" className="text-xs text-brand-text-muted">
          Dynamic image variable
        </Label>
        <Input
          id="image-variable"
          value={element.variable ?? ""}
          placeholder="e.g. photo"
          spellCheck={false}
          className={`${compactInputClassName} font-mono`}
          onChange={(event) => {
            const next = sanitizeVariableName(event.target.value)
            update({
              variable:
                next && TEMPLATE_VARIABLE_NAME_PATTERN.test(next) ? next : null,
            })
          }}
          onFocus={transaction.onFocus}
          onBlur={transaction.onBlur}
        />
        <p className="text-xs text-muted-foreground">
          Send this as a file in form-data, or a URL / data URI in JSON.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="image-fit" className="text-xs text-brand-text-muted">
            Fit
          </Label>
          <Select value={element.fit} onValueChange={(value) => update({ fit: value as ImageFit })}>
            <SelectTrigger id="image-fit" className={selectTriggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value="contain">Contain</SelectItem>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="fill">Stretch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NumberField
          id="image-radius"
          label="Corner radius"
          min={0}
          value={element.radius}
          onChange={(radius) => update({ radius })}
          transaction={transaction}
        />
      </div>
    </div>
  )
}

function RectProperties({
  element,
  update,
  transaction,
}: {
  element: RectElement
  update: (patch: ElementPatch) => void
  transaction: TransactionHandlers
}) {
  return (
    <div className="space-y-3">
      <ColorField
        id="rect-fill"
        label="Fill"
        value={element.fill}
        allowEmpty
        onChange={(fill) => update({ fill })}
        transaction={transaction}
      />
      <ColorField
        id="rect-stroke"
        label="Border color"
        value={element.stroke}
        allowEmpty
        onChange={(stroke) => update({ stroke })}
        transaction={transaction}
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          id="rect-stroke-width"
          label="Border width"
          min={0}
          value={element.strokeWidth}
          onChange={(strokeWidth) => update({ strokeWidth })}
          transaction={transaction}
        />
        <NumberField
          id="rect-radius"
          label="Corner radius"
          min={0}
          value={element.radius}
          onChange={(radius) => update({ radius })}
          transaction={transaction}
        />
      </div>
    </div>
  )
}
