"use client"

import { Search } from "lucide-react"
import { useState } from "react"

import { IconGlyph } from "@/components/templates/icon-glyph"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { iconNames } from "@/lib/templates/icon-catalog"
import { cn } from "@/lib/utils"

type IconPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onSelect: (name: string) => void
}

export function formatIconName(name: string): string {
  return name.replace(/-/g, " ")
}

export function IconPickerDialog({ open, onOpenChange, value, onSelect }: IconPickerDialogProps) {
  const [query, setQuery] = useState("")
  const normalized = query.trim().toLowerCase()
  const matches = normalized
    ? iconNames.filter((name) => name.includes(normalized))
    : iconNames

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Choose an icon</DialogTitle>
          <DialogDescription>
            {iconNames.length} outline icons. They print as vector shapes, so any size stays sharp.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            autoFocus
            value={query}
            placeholder="Search icons"
            aria-label="Search icons"
            className="ps-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {matches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No icons match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="grid max-h-80 grid-cols-6 gap-1 overflow-y-auto pe-1 sm:grid-cols-8">
            {matches.map((name) => (
              <button
                key={name}
                type="button"
                title={formatIconName(name)}
                aria-label={formatIconName(name)}
                aria-pressed={name === value}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border p-2 text-brand-text-heading transition-colors hover:bg-brand-mist/60",
                  name === value
                    ? "border-brand-teal bg-brand-teal/10"
                    : "border-transparent"
                )}
                onClick={() => {
                  onSelect(name)
                  onOpenChange(false)
                }}
              >
                <IconGlyph name={name} strokeWidth={1.75} className="size-6" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
