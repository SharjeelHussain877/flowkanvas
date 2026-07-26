"use client"

import { Check, UserPlus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { settingsPrimaryButtonClassName } from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
import { Button } from "@/components/ui/button"
import { copyToClipboard } from "@/lib/copy-to-clipboard"

type InviteLinkButtonProps = {
  inviteLink: string
}

export function InviteLinkButton({ inviteLink }: InviteLinkButtonProps) {
  const [copied, setCopied] = useState(false)
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  async function handleCopyInviteLink() {
    if (!inviteLink) {
      return
    }

    const didCopy = await copyToClipboard(inviteLink)

    if (!didCopy) {
      console.error("Unable to copy invite link")
      return
    }

    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current)
    }

    setCopied(true)
    copyResetTimeoutRef.current = setTimeout(() => {
      setCopied(false)
      copyResetTimeoutRef.current = null
    }, 3000)
  }

  return (
    <Button
      type="button"
      className={settingsPrimaryButtonClassName}
      onClick={handleCopyInviteLink}
      disabled={!inviteLink}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <UserPlus className="size-4" aria-hidden />
      )}
      {copied ? "Copied!" : "Copy invite link"}
    </Button>
  )
}
