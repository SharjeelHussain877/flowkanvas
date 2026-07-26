"use client"

import { Link2, Loader2 } from "lucide-react"
import { useState } from "react"

import { authPrimaryButtonClassName } from "@/app/(auth)/_components/auth-submit-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  label = "Connect Canva",
  redirectingLabel = "Redirecting...",
}: ConnectCanvaButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  function handleConnect() {
    setIsConnecting(true)
    window.location.assign(buildConnectUrl(returnTo))
  }

  return (
    <Button
      type="button"
      className={cn(authPrimaryButtonClassName, className)}
      disabled={isConnecting}
      aria-busy={isConnecting}
      onClick={handleConnect}
    >
      {isConnecting ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Link2 className="size-4" aria-hidden />
      )}
      {isConnecting ? redirectingLabel : label}
    </Button>
  )
}
