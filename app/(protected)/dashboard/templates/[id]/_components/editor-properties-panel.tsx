"use client"

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Copy,
  Group,
  Trash2,
  Ungroup,
} from "lucide-react"
import type { Dispatch } from "react"

import { ElementProperties, sanitizeVariableName } from "@/app/(protected)/dashboard/templates/[id]/_components/editor-element-properties"
import {
  ColorField,
  compactInputClassName,
  NumberField,
  PanelSection,
  SelectField,
  type TransactionHandlers,
} from "@/app/(protected)/dashboard/templates/[id]/_components/editor-fields"
import type {
  EditorAction,
  ElementPatch,
} from "@/app/(protected)/dashboard/templates/[id]/_components/use-editor-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ALIGN_MODE_LABELS, type AlignMode } from "@/lib/templates/alignment"
import { CONDITION_OPERATOR_LABELS, describeCondition } from "@/lib/templates/conditions"
import { ELEMENT_TYPE_LABELS } from "@/lib/templates/design"
import {
  CUSTOM_PRESET_ID,
  findPresetBySize,
  pageSizePresets,
} from "@/lib/templates/presets"
import {
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  TEMPLATE_VARIABLE_NAME_PATTERN,
  type ConditionOperator,
  type DesignElement,
  type DesignPage,
  type TemplateDesign,
  type VisibilityCondition,
} from "@/schemas/templates/design"

type EditorPropertiesPanelProps = {
  design: TemplateDesign
  page: DesignPage
  elements: DesignElement[]
  templateId: string
  dispatch: Dispatch<EditorAction>
}

const ALIGN_BUTTONS: Array<{ mode: AlignMode; icon: typeof AlignStartVertical }> = [
  { mode: "left", icon: AlignStartVertical },
  { mode: "center", icon: AlignCenterVertical },
  { mode: "right", icon: AlignEndVertical },
  { mode: "top", icon: AlignStartHorizontal },
  { mode: "middle", icon: AlignCenterHorizontal },
  { mode: "bottom", icon: AlignEndHorizontal },
]

export function EditorPropertiesPanel({
  design,
  page,
  elements,
  templateId,
  dispatch,
}: EditorPropertiesPanelProps) {
  const transaction: TransactionHandlers = {
    onFocus: () => dispatch({ type: "begin-transaction" }),
    onBlur: () => dispatch({ type: "end-transaction" }),
  }

  if (elements.length === 0) {
    return (
      <DocumentProperties design={design} page={page} dispatch={dispatch} transaction={transaction} />
    )
  }

  const ids = elements.map((element) => element.id)
  const single = elements.length === 1 ? elements[0] : null
  const grouped = elements.some((element) => element.group)
  const allSameGroup =
    grouped && elements.every((element) => element.group && element.group === elements[0].group)

  return (
    <div>
      <PanelSection
        title={single ? ELEMENT_TYPE_LABELS[single.type] : `${elements.length} elements`}
        action={
          <div className="flex gap-1">
            {elements.length > 1 && !allSameGroup ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Group"
                title="Group (⌘G)"
                onClick={() => dispatch({ type: "group-elements", ids })}
              >
                <Group className="size-3.5" aria-hidden />
              </Button>
            ) : null}
            {grouped ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Ungroup"
                title="Ungroup (⌘⇧G)"
                onClick={() => dispatch({ type: "ungroup-elements", ids })}
              >
                <Ungroup className="size-3.5" aria-hidden />
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Duplicate"
              title="Duplicate (⌘D)"
              onClick={() => dispatch({ type: "duplicate-elements", ids })}
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
              onClick={() => dispatch({ type: "remove-elements", ids })}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </div>
        }
      >
        {single ? (
          <ElementProperties
            element={single}
            templateId={templateId}
            update={(patch) => dispatch({ type: "update-element", id: single.id, patch })}
            transaction={transaction}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            {allSameGroup
              ? "These elements move and resize together. Ungroup to edit one of them."
              : "Drag to move them together. Resize handles scale the whole selection."}
          </p>
        )}
      </PanelSection>

      <PanelSection title={single ? "Align to page" : "Arrange"}>
        <div className="grid grid-cols-6 gap-1">
          {ALIGN_BUTTONS.map((item) => (
            <Button
              key={item.mode}
              type="button"
              size="sm"
              variant="outline"
              aria-label={ALIGN_MODE_LABELS[item.mode]}
              title={ALIGN_MODE_LABELS[item.mode]}
              onClick={() => dispatch({ type: "align-elements", ids, mode: item.mode })}
            >
              <item.icon className="size-3.5" aria-hidden />
            </Button>
          ))}
        </div>
        {elements.length >= 3 ? (
          <div className="grid grid-cols-2 gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => dispatch({ type: "distribute-elements", ids, axis: "horizontal" })}
            >
              <AlignHorizontalDistributeCenter className="size-3.5" aria-hidden />
              Space evenly ↔
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => dispatch({ type: "distribute-elements", ids, axis: "vertical" })}
            >
              <AlignVerticalDistributeCenter className="size-3.5" aria-hidden />
              Space evenly ↕
            </Button>
          </div>
        ) : null}
      </PanelSection>

      {single ? (
        <>
          <PanelSection title="Position & size">
            <div className="grid grid-cols-2 gap-2">
              <NumberField id="el-x" label="X" value={single.x} onChange={(x) => update(dispatch, single, { x })} transaction={transaction} />
              <NumberField id="el-y" label="Y" value={single.y} onChange={(y) => update(dispatch, single, { y })} transaction={transaction} />
              <NumberField id="el-w" label="Width" min={1} value={single.width} onChange={(width) => update(dispatch, single, { width })} transaction={transaction} />
              <NumberField id="el-h" label="Height" min={1} value={single.height} onChange={(height) => update(dispatch, single, { height })} transaction={transaction} />
            </div>
          </PanelSection>

          <VisibilitySection element={single} dispatch={dispatch} transaction={transaction} />

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
                    dispatch({ type: "reorder-element", id: single.id, direction: item.direction })
                  }
                >
                  <item.icon className="size-3.5" aria-hidden />
                </Button>
              ))}
            </div>
          </PanelSection>
        </>
      ) : null}
    </div>
  )
}

function update(dispatch: Dispatch<EditorAction>, element: DesignElement, patch: ElementPatch) {
  dispatch({ type: "update-element", id: element.id, patch })
}

function VisibilitySection({
  element,
  dispatch,
  transaction,
}: {
  element: DesignElement
  dispatch: Dispatch<EditorAction>
  transaction: TransactionHandlers
}) {
  const condition = element.condition

  const setCondition = (next: VisibilityCondition | null) =>
    dispatch({ type: "update-element", id: element.id, patch: { condition: next } })

  return (
    <PanelSection
      title="Visibility"
      action={
        <label className="flex items-center gap-2 text-xs text-brand-text-muted">
          <input
            type="checkbox"
            className="size-4 accent-brand-teal"
            checked={condition !== null}
            onChange={(event) =>
              setCondition(
                event.target.checked
                  ? { variable: "show_badge", operator: "set", value: "" }
                  : null
              )
            }
          />
          Conditional
        </label>
      }
    >
      {condition ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="condition-variable" className="text-xs text-brand-text-muted">
              Variable
            </Label>
            <Input
              id="condition-variable"
              value={condition.variable}
              spellCheck={false}
              className={`${compactInputClassName} font-mono`}
              onChange={(event) => {
                const next = sanitizeVariableName(event.target.value)

                if (next && TEMPLATE_VARIABLE_NAME_PATTERN.test(next)) {
                  setCondition({ ...condition, variable: next })
                }
              }}
              onFocus={transaction.onFocus}
              onBlur={transaction.onBlur}
            />
          </div>
          <SelectField<ConditionOperator>
            id="condition-operator"
            label="Show when it"
            value={condition.operator}
            onChange={(operator) => setCondition({ ...condition, operator })}
            options={(Object.keys(CONDITION_OPERATOR_LABELS) as ConditionOperator[]).map(
              (operator) => ({ value: operator, label: CONDITION_OPERATOR_LABELS[operator] })
            )}
          />
          {condition.operator === "equals" || condition.operator === "not_equals" ? (
            <div className="space-y-1">
              <Label htmlFor="condition-value" className="text-xs text-brand-text-muted">
                Value
              </Label>
              <Input
                id="condition-value"
                value={condition.value}
                className={compactInputClassName}
                onChange={(event) => setCondition({ ...condition, value: event.target.value })}
                onFocus={transaction.onFocus}
                onBlur={transaction.onBlur}
              />
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">{describeCondition(condition)}.</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Always printed. Turn on to show this element only when a payload variable is set,
          empty, or equals a value - for example a &ldquo;VIP&rdquo; badge or a discount line.
        </p>
      )}
    </PanelSection>
  )
}

function DocumentProperties({
  design,
  page,
  dispatch,
  transaction,
}: {
  design: TemplateDesign
  page: DesignPage
  dispatch: Dispatch<EditorAction>
  transaction: TransactionHandlers
}) {
  const presetId = findPresetBySize(design.width, design.height)?.id ?? CUSTOM_PRESET_ID
  const pageIndex = design.pages.findIndex((item) => item.id === page.id) + 1

  return (
    <div>
      <PanelSection title="Page size">
        <SelectField
          id="page-preset"
          label="Preset"
          value={presetId}
          onChange={(value) => {
            const preset = pageSizePresets.find((item) => item.id === value)

            if (preset) {
              dispatch({
                type: "update-document",
                patch: { width: preset.width, height: preset.height },
              })
            }
          }}
          options={[
            ...pageSizePresets.map((preset) => ({
              value: preset.id,
              label: preset.label,
              hint: `${preset.width} × ${preset.height}`,
            })),
            { value: CUSTOM_PRESET_ID, label: "Custom size" },
          ]}
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id="page-width"
            label="Width (px)"
            min={MIN_PAGE_SIZE}
            max={MAX_PAGE_SIZE}
            value={design.width}
            onChange={(width) => dispatch({ type: "update-document", patch: { width } })}
            transaction={transaction}
          />
          <NumberField
            id="page-height"
            label="Height (px)"
            min={MIN_PAGE_SIZE}
            max={MAX_PAGE_SIZE}
            value={design.height}
            onChange={(height) => dispatch({ type: "update-document", patch: { height } })}
            transaction={transaction}
          />
        </div>
        {design.pages.length > 1 ? (
          <p className="text-xs text-muted-foreground">Applies to all {design.pages.length} pages.</p>
        ) : null}
      </PanelSection>

      <PanelSection title={design.pages.length > 1 ? `Page ${pageIndex}` : "Page"}>
        <ColorField
          id="page-background"
          label="Background"
          value={page.background}
          onChange={(background) => dispatch({ type: "update-page", id: page.id, patch: { background } })}
          transaction={transaction}
        />
      </PanelSection>

      <PanelSection title="Tips">
        <ul className="list-disc space-y-1 ps-4 text-xs text-muted-foreground">
          <li>Click an element to edit it. Double-click text to type. Drag on empty space to select several.</li>
          <li>
            Write <code>{"{{name}}"}</code> inside text, QR codes or barcodes to make it a variable.
          </li>
          <li>Elements snap to edges and centers while dragging; hold ⌥ to move freely.</li>
          <li>⇧-click adds to the selection. ⌘G groups, ⌘⇧G ungroups, ⌘C / ⌘V copy and paste (also across pages).</li>
          <li>Arrow keys nudge, ⇧ for 10px. ⌘Z / ⌘⇧Z undo and redo.</li>
        </ul>
      </PanelSection>
    </div>
  )
}
