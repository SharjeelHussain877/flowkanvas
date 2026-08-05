import Image from "next/image"

import { cn } from "@/lib/utils"

/** Official Canva icon logo — use inside UI below 50px; keep ≥8px padding around it. */
export const CANVA_ICON_SRC = "/brand/canva/canva-icon.svg"

export interface CanvaIconProps {
  className?: string
  /** Pixel size of the icon (default 20). */
  size?: number
}

export function CanvaIcon({ className, size = 20 }: CanvaIconProps) {
  return (
    <Image
      src={CANVA_ICON_SRC}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
      unoptimized
    />
  )
}
