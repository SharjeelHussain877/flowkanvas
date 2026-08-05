"use client"

import { LayoutTemplate } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CanvaTemplateListItem } from "@/schemas/canva/templates"
import { cn } from "@/lib/utils"

type TemplatePreviewCardProps = {
  item: CanvaTemplateListItem
  className?: string
}

export function TemplatePreviewCard({ item, className }: TemplatePreviewCardProps) {
  const sizeText = item.sizeLabel
    ? item.orientationLabel
      ? `${item.sizeLabel} · ${item.orientationLabel}`
      : item.sizeLabel
    : null

  const kindLabel =
    item.kind === "brand_template" ? "Canva brand template" : "Canva design"
  const actionHint =
    item.kind === "brand_template"
      ? "Open this brand template in Canva"
      : "Open this design in Canva"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={item.viewUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${actionHint}: ${item.title}`}
          className={cn(
            "group block overflow-hidden rounded-xl transition-shadow hover:shadow-md",
            className
          )}
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-surface">
            {item.thumbnailUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.thumbnailUrl}
                alt={`${kindLabel}: ${item.title}`}
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-mist/40 text-brand-slate">
                <LayoutTemplate className="size-10 opacity-40" aria-hidden />
              </div>
            )}

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `
              radial-gradient(ellipse 150% 95% at 50% 100%, rgba(0, 0, 0, 0.62) 0%, rgba(0, 0, 0, 0.28) 38%, rgba(0, 0, 0, 0.08) 62%, transparent 88%),
              linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.22) 28%, rgba(0, 0, 0, 0.08) 52%, rgba(0, 0, 0, 0.02) 72%, transparent 100%)
            `,
              }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
              style={{
                background: `
              radial-gradient(ellipse 150% 95% at 50% 100%, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.42) 40%, rgba(0, 0, 0, 0.14) 68%, transparent 92%),
              linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.38) 32%, rgba(0, 0, 0, 0.12) 58%, transparent 100%)
            `,
              }}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4 pt-16">
              <div className="translate-y-5 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-white drop-shadow-sm">
                  {item.title}
                </p>
                <p className="mt-1.5 text-xs text-white/80 drop-shadow-sm">
                  {kindLabel} · Updated {item.updatedAt}
                </p>
              </div>

              {sizeText ? (
                <p className="mt-2 text-[11px] font-medium tracking-wide text-white/85 drop-shadow-sm">
                  {sizeText}
                </p>
              ) : null}
            </div>
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top">{actionHint}</TooltipContent>
    </Tooltip>
  )
}
