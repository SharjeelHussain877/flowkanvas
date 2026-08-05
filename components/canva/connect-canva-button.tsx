"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"

import { CanvaIcon } from "@/components/canva/canva-icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Canva Connect UI guidelines:
 * https://www.canva.dev/docs/connect/guidelines/user-interface/
 * - Icon logo (not script) inside the button
 * - ≥8px margin around the icon
 * - Icon always paired with clear action text
 */
export const canvaConnectButtonClassName = cn(
  "h-11 gap-2 rounded-lg border border-[#d7d9de] bg-white px-5",
  "text-[15px] font-medium text-[#0f1015]",
  "hover:bg-[#f5f6f8] hover:text-[#0f1015]",
  "disabled:opacity-70"
)

type ConnectCanvaButtonProps = {
  returnTo?: string
  className?: string
  label?: string
  redirectingLabel?: string
}

function buildConnectUrl(returnTo?: string) {
  if (!returnTo) {
    return "/api/auth/canva/connect"
  }

  const params = new URLSearchParams({ returnTo })
  return `/api/auth/canva/connect?${params.toString()}`
}

export function ConnectCanvaButton({
  returnTo,
  className,
  label = "Connect to Canva",
  redirectingLabel = "Connecting…",
}: ConnectCanvaButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  function handleConnect() {
    setIsConnecting(true)
    window.location.assign(buildConnectUrl(returnTo))
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(canvaConnectButtonClassName, className)}
      disabled={isConnecting}
      aria-busy={isConnecting}
      onClick={handleConnect}
    >
      {isConnecting ? (
        <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <CanvaIcon size={20} />
      )}
      {isConnecting ? redirectingLabel : label}
    </Button>
  )
}
