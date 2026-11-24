"use client"

import { useMutation } from "@tanstack/react-query"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  ImageUp,
  Italic,
  type LucideIcon,
} from "lucide-react"
import { useRef, useState } from "react"

import {
  ColorField,
  compactInputClassName,
  NumberField,
  SelectField,
  selectTriggerClassName,
  SwitchField,
  ToggleGroup,
  type TransactionHandlers,
} from "@/app/(protected)/dashboard/templates/[id]/_components/editor-fields"
import type { ElementPatch } from "@/app/(protected)/dashboard/templates/[id]/_components/use-editor-state"
import { FontsDialog } from "@/components/templates/fonts-dialog"
import { IconGlyph } from "@/components/templates/icon-glyph"
import { formatIconName, IconPickerDialog } from "@/components/templates/icon-picker-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { BARCODE_FORMAT_HINTS, BARCODE_FORMAT_LABELS } from "@/lib/barcodes"
import { useFontsQuery } from "@/lib/query/hooks/use-fonts"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import {
  getCustomFontName,
  groupFontFamilies,
  isCustomFontFamily,
  isStandardFontFamily,
  standardFontOptions,
  toCustomFontFamily,
} from "@/lib/templates/fonts"
import {
  TEMPLATE_VARIABLE_NAME_PATTERN,
  type BarcodeElement,
  type BarcodeFormat,
  type DesignElement,
  type EllipseElement,
  type IconElement,
  type ImageElement,
  type ImageFit,
  type LineElement,
  type LineOrientation,
  type QrCodeElement,
  type QrErrorCorrection,
  type RectElement,
  type TextAlign,
  type TextElement,
  type VerticalAlign,
} from "@/schemas/templates/design"
import type { TemplateAssetUploadResponse } from "@/schemas/templates/template"

type SectionProps<T extends DesignElement> = {
  element: T
  update: (patch: ElementPatch) => void
  transaction: TransactionHandlers
}

const MANAGE_FONTS_VALUE = "__manage_fonts__"

function VerticalAlignIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-3.5" aria-hidden />
}

export function sanitizeVariableName(raw: string): string {
  return raw.trim().replace(/[^A-Za-z0-9_]/g, "_").replace(/^(\d)/, "_$1")
}

function FontPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (family: string) => void
}) {
  const fontsQuery = useFontsQuery()
  const [dialogOpen, setDialogOpen] = useState(false)
  const families = groupFontFamilies(fontsQuery.data ?? [])
  const isMissingCustom =
    isCustomFontFamily(value) && !families.some((family) => family.family === value)

  return (
    <div className="space-y-1">
      <Label htmlFor="text-font" className="text-xs text-brand-text-muted">
        Font
      </Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next === MANAGE_FONTS_VALUE) {
            setDialogOpen(true)
            return
          }

          onChange(next)
        }}
      >
        <SelectTrigger id="text-font" className={selectTriggerClassName}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="max-h-80">
          <SelectGroup>
            <SelectLabel>Built-in</SelectLabel>
            {standardFontOptions.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.cssFamily }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectGroup>
          {families.length > 0 || isMissingCustom ? (
            <SelectGroup>
              <SelectLabel>Your fonts</SelectLabel>
              {families.map((family) => (
                <SelectItem key={family.family} value={family.family}>
                  <span style={{ fontFamily: `"${family.family}", Helvetica, Arial, sans-serif` }}>
                    {family.name}
                  </span>
                </SelectItem>
              ))}
              {isMissingCustom ? (
                <SelectItem value={value}>
                  {getCustomFontName(value)}
                  <span className="ms-2 text-xs text-destructive">missing</span>
                </SelectItem>
              ) : null}
            </SelectGroup>
          ) : null}
          <SelectSeparator />
          <SelectItem value={MANAGE_FONTS_VALUE}>Upload or manage fonts…</SelectItem>
        </SelectContent>
      </Select>
      {isMissingCustom ? (
        <p className="text-xs text-destructive">
          This font was deleted. PDFs fall back to Helvetica until you pick another.
        </p>
      ) : !isStandardFontFamily(value) ? (
        <p className="text-xs text-muted-foreground">Embedded in the PDF.</p>
      ) : null}
      <FontsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUploaded={(font) => onChange(toCustomFontFamily(font.name))}
      />
    </div>
  )
}

function TextProperties({ element, update, transaction }: SectionProps<TextElement>) {
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
        <FontPicker value={element.fontFamily} onChange={(fontFamily) => update({ fontFamily })} />
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
}: SectionProps<ImageElement> & { templateId: string }) {
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
            <Button type="button" variant="ghost" size="sm" onClick={() => update({ src: null })}>
              Remove
            </Button>
          ) : null}
        </div>
        {uploadMutation.isError ? (
          <p className="text-xs text-destructive">
            {uploadMutation.error instanceof Error ? uploadMutation.error.message : "Upload failed"}
          </p>
        ) : null}
        {element.src && element.variable ? (
          <p className="text-xs text-muted-foreground">
            Used as a placeholder when the API does not send <code>{element.variable}</code>.
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
            update({ variable: next && TEMPLATE_VARIABLE_NAME_PATTERN.test(next) ? next : null })
          }}
          onFocus={transaction.onFocus}
          onBlur={transaction.onBlur}
        />
        <p className="text-xs text-muted-foreground">
          Send this as a file in form-data, or a URL / data URI in JSON.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SelectField<ImageFit>
          id="image-fit"
          label="Fit"
          value={element.fit}
          onChange={(fit) => update({ fit })}
          options={[
            { value: "contain", label: "Contain" },
            { value: "cover", label: "Cover" },
            { value: "fill", label: "Stretch" },
          ]}
        />
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

function RectProperties({ element, update, transaction }: SectionProps<RectElement>) {
  return (
    <div className="space-y-3">
      <ColorField id="rect-fill" label="Fill" value={element.fill} allowEmpty onChange={(fill) => update({ fill })} transaction={transaction} />
      <ColorField id="rect-stroke" label="Border color" value={element.stroke} allowEmpty onChange={(stroke) => update({ stroke })} transaction={transaction} />
      <div className="grid grid-cols-2 gap-2">
        <NumberField id="rect-stroke-width" label="Border width" min={0} value={element.strokeWidth} onChange={(strokeWidth) => update({ strokeWidth })} transaction={transaction} />
        <NumberField id="rect-radius" label="Corner radius" min={0} value={element.radius} onChange={(radius) => update({ radius })} transaction={transaction} />
      </div>
    </div>
  )
}

function EllipseProperties({ element, update, transaction }: SectionProps<EllipseElement>) {
  return (
    <div className="space-y-3">
      <ColorField id="ellipse-fill" label="Fill" value={element.fill} allowEmpty onChange={(fill) => update({ fill })} transaction={transaction} />
      <ColorField id="ellipse-stroke" label="Border color" value={element.stroke} allowEmpty onChange={(stroke) => update({ stroke })} transaction={transaction} />
      <NumberField id="ellipse-stroke-width" label="Border width" min={0} value={element.strokeWidth} onChange={(strokeWidth) => update({ strokeWidth })} transaction={transaction} />
      <p className="text-xs text-muted-foreground">Equal width and height make a circle.</p>
    </div>
  )
}

function LineProperties({ element, update, transaction }: SectionProps<LineElement>) {
  return (
    <div className="space-y-3">
      <SelectField<LineOrientation>
        id="line-orientation"
        label="Direction"
        value={element.orientation}
        onChange={(orientation) => update({ orientation })}
        options={[
          { value: "horizontal", label: "Horizontal" },
          { value: "vertical", label: "Vertical" },
          { value: "diagonal-down", label: "Diagonal ↘" },
          { value: "diagonal-up", label: "Diagonal ↗" },
        ]}
      />
      <ColorField id="line-stroke" label="Color" value={element.stroke} onChange={(stroke) => update({ stroke })} transaction={transaction} />
      <div className="grid grid-cols-2 gap-2">
        <NumberField id="line-width" label="Thickness" min={0.5} max={100} step={0.5} value={element.strokeWidth} onChange={(strokeWidth) => update({ strokeWidth })} transaction={transaction} />
        <NumberField id="line-dash" label="Dash length" min={0} max={100} value={element.dash} onChange={(dash) => update({ dash })} transaction={transaction} />
      </div>
      <p className="text-xs text-muted-foreground">Dash length 0 draws a solid line.</p>
    </div>
  )
}

function IconProperties({ element, update, transaction }: SectionProps<IconElement>) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="text-xs text-brand-text-muted">Icon</span>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-start gap-3"
          onClick={() => setPickerOpen(true)}
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-brand-mist/70">
            <IconGlyph name={element.name} color={element.color} strokeWidth={2} className="size-5" />
          </span>
          <span className="capitalize">{formatIconName(element.name)}</span>
          <span className="ms-auto text-xs text-muted-foreground">Change</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ColorField id="icon-color" label="Color" value={element.color} onChange={(color) => update({ color })} transaction={transaction} />
        <NumberField id="icon-stroke" label="Line weight" min={0.5} max={4} step={0.25} value={element.strokeWidth} onChange={(strokeWidth) => update({ strokeWidth })} transaction={transaction} />
      </div>
      <IconPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={element.name}
        onSelect={(name) => update({ name })}
      />
    </div>
  )
}

function QrCodeProperties({ element, update, transaction }: SectionProps<QrCodeElement>) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="qr-value" className="text-xs text-brand-text-muted">
          Content
        </Label>
        <Textarea
          id="qr-value"
          value={element.value}
          rows={2}
          className="min-h-12 font-mono text-xs"
          placeholder="https://example.com/{{code}}"
          onChange={(event) => update({ value: event.target.value })}
          onFocus={transaction.onFocus}
          onBlur={transaction.onBlur}
        />
        <p className="text-xs text-muted-foreground">
          A URL, ticket id or any text. <code>{"{{variables}}"}</code> are filled per PDF.
        </p>
      </div>
      <SelectField<QrErrorCorrection>
        id="qr-ecl"
        label="Error correction"
        value={element.errorCorrection}
        onChange={(errorCorrection) => update({ errorCorrection })}
        options={[
          { value: "L", label: "Low", hint: "7% · smallest" },
          { value: "M", label: "Medium", hint: "15% · recommended" },
          { value: "Q", label: "Quartile", hint: "25%" },
          { value: "H", label: "High", hint: "30% · survives logos" },
        ]}
      />
      <div className="grid grid-cols-2 gap-2">
        <ColorField id="qr-color" label="Modules" value={element.color} onChange={(color) => update({ color })} transaction={transaction} />
        <ColorField id="qr-bg" label="Background" value={element.background} allowEmpty onChange={(background) => update({ background })} transaction={transaction} />
      </div>
    </div>
  )
}

function BarcodeProperties({ element, update, transaction }: SectionProps<BarcodeElement>) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="barcode-value" className="text-xs text-brand-text-muted">
          Value
        </Label>
        <Input
          id="barcode-value"
          value={element.value}
          spellCheck={false}
          className={`${compactInputClassName} font-mono`}
          placeholder={element.format === "ean13" ? "590123412345" : "{{sku}}"}
          onChange={(event) => update({ value: event.target.value })}
          onFocus={transaction.onFocus}
          onBlur={transaction.onBlur}
        />
      </div>
      <SelectField<BarcodeFormat>
        id="barcode-format"
        label="Format"
        value={element.format}
        onChange={(format) => update({ format })}
        options={(Object.keys(BARCODE_FORMAT_LABELS) as BarcodeFormat[]).map((format) => ({
          value: format,
          label: BARCODE_FORMAT_LABELS[format],
        }))}
      />
      <p className="text-xs text-muted-foreground">{BARCODE_FORMAT_HINTS[element.format]}</p>
      <SwitchField
        id="barcode-text"
        label="Print value under the bars"
        checked={element.showText}
        onChange={(showText) => update({ showText })}
      />
      <div className="grid grid-cols-2 gap-2">
        <ColorField id="barcode-color" label="Bars" value={element.color} onChange={(color) => update({ color })} transaction={transaction} />
        <ColorField id="barcode-bg" label="Background" value={element.background} allowEmpty onChange={(background) => update({ background })} transaction={transaction} />
      </div>
    </div>
  )
}

export function ElementProperties({
  element,
  templateId,
  update,
  transaction,
}: {
  element: DesignElement
  templateId: string
  update: (patch: ElementPatch) => void
  transaction: TransactionHandlers
}) {
  switch (element.type) {
    case "text":
      return <TextProperties element={element} update={update} transaction={transaction} />
    case "image":
      return (
        <ImageProperties
          element={element}
          templateId={templateId}
          update={update}
          transaction={transaction}
        />
      )
    case "rect":
      return <RectProperties element={element} update={update} transaction={transaction} />
    case "ellipse":
      return <EllipseProperties element={element} update={update} transaction={transaction} />
    case "line":
      return <LineProperties element={element} update={update} transaction={transaction} />
    case "icon":
      return <IconProperties element={element} update={update} transaction={transaction} />
    case "qrcode":
      return <QrCodeProperties element={element} update={update} transaction={transaction} />
    case "barcode":
      return <BarcodeProperties element={element} update={update} transaction={transaction} />
    default:
      return null
  }
}
