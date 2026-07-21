import Image from "next/image"

import { cn } from "@/lib/utils"

type BrandLogoProps = {
  variant?: "full" | "square"
  className?: string
  priority?: boolean
}

export function BrandLogo({
  variant = "full",
  className,
  priority = false,
}: BrandLogoProps) {
  if (variant === "square") {
    return (
      <Image
        src="/logosquare.png"
        alt="CanvasFlow"
        width={48}
        height={48}
        className={cn("size-full object-contain", className)}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src="/logo.png"
      alt="CanvasFlow"
      width={400}
      height={100}
      className={cn("size-full object-contain object-left", className)}
      priority={priority}
    />
  )
}
