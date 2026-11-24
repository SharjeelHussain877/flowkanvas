"use client"

import { useState, type ReactNode } from "react"

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
import { cn } from "@/lib/utils"

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export const compactInputClassName = "h-9 px-2.5 py-0 text-sm"

export const selectTriggerClassName =
  "h-9 w-full min-w-0 rounded-sm border border-brand-input-border bg-brand-input px-2.5 text-sm text-brand-text-heading"

export type TransactionHandlers = {
  onFocus: () => void
  onBlur: () => void
}

export function PanelSection({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="space-y-3 border-b border-border/70 px-4 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-brand-text-muted uppercase">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

type NumberFieldProps = {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  transaction?: TransactionHandlers
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  transaction,
}: NumberFieldProps) {
  /** Raw text while the field is focused; falls back to the live value otherwise. */
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? String(value)

  function commit(raw: string) {
    setDraft(raw)
    const parsed = Number(raw)

    if (raw.trim() === "" || !Number.isFinite(parsed)) {
      return
    }

    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed))
    onChange(clamped)
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-brand-text-muted">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step}
        className={compactInputClassName}
        onChange={(event) => commit(event.target.value)}
        onFocus={transaction?.onFocus}
        onBlur={() => {
          setDraft(null)
          transaction?.onBlur()
        }}
      />
    </div>
  )
}

type ColorFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  allowEmpty?: boolean
  transaction?: TransactionHandlers
}

export function ColorField({
  id,
  label,
  value,
  onChange,
  allowEmpty = false,
  transaction,
}: ColorFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? value

  function commitText(raw: string) {
    setDraft(raw)
    const trimmed = raw.trim()

    if (trimmed === "" && allowEmpty) {
      onChange("")
      return
    }

    if (HEX_PATTERN.test(trimmed)) {
      onChange(trimmed.toLowerCase())
    }
  }

  const swatchValue = HEX_PATTERN.test(value) ? value.slice(0, 7) : "#ffffff"

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-brand-text-muted">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <label
          className={cn(
            "relative size-9 shrink-0 overflow-hidden rounded-sm border border-brand-input-border",
            value === "" &&
              "bg-[linear-gradient(135deg,transparent_45%,var(--destructive)_45%,var(--destructive)_55%,transparent_55%)]"
          )}
          style={{ backgroundColor: value || undefined }}
          aria-label={`${label} swatch`}
        >
          <input
            type="color"
            value={swatchValue}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            onChange={(event) => commitText(event.target.value)}
            onFocus={transaction?.onFocus}
            onBlur={transaction?.onBlur}
          />
        </label>
        <Input
          id={id}
          value={text}
          placeholder={allowEmpty ? "None" : "#000000"}
          spellCheck={false}
          className={cn(compactInputClassName, "font-mono")}
          onChange={(event) => commitText(event.target.value)}
          onFocus={transaction?.onFocus}
          onBlur={() => {
            setDraft(null)
            transaction?.onBlur()
          }}
        />
        {allowEmpty && value !== "" ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0"
            onClick={() => {
              setDraft(null)
              onChange("")
            }}
          >
            None
          </Button>
        ) : null}
      </div>
    </div>
  )
}

type ToggleGroupProps<T extends string> = {
  label: string
  value: T
  options: Array<{ value: T; label: string; icon: ReactNode }>
  onChange: (value: T) => void
}

export function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-brand-text-muted">{label}</span>
      <div className="flex gap-1" role="group" aria-label={label}>
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="icon-sm"
            variant={option.value === value ? "secondary" : "outline"}
            aria-pressed={option.value === value}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
          </Button>
        ))}
      </div>
    </div>
  )
}

type SelectFieldProps<T extends string> = {
  id: string
  label: string
  value: T
  options: Array<{ value: T; label: ReactNode; hint?: string }>
  onChange: (value: T) => void
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-brand-text-muted">
        {label}
      </Label>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger id={id} className={selectTriggerClassName}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
              {option.hint ? (
                <span className="ms-2 text-xs text-muted-foreground">{option.hint}</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function SwitchField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-3 text-xs text-brand-text-muted">
      <span>{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        className="size-4 accent-brand-teal"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}
