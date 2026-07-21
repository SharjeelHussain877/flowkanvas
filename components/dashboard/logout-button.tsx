"use client"

import { useMutation } from "@tanstack/react-query"
import { Loader2, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api/client"
import type { LogoutResponse } from "@/schemas/auth/logout"

export function DashboardLogoutButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: () =>
      apiClient<LogoutResponse>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      setOpen(false)
      router.push("/login")
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (logoutMutation.isPending) {
      return
    }

    setOpen(nextOpen)
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Log out"
        className="size-9 rounded-lg bg-destructive text-white hover:bg-destructive/90 hover:text-white"
        onClick={() => setOpen(true)}
      >
        <LogOut className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden border border-border/60 bg-white p-0 shadow-xl sm:max-w-[22rem]"
        >
          <div className="px-6 pt-8 pb-6 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="size-5" />
            </div>

            <DialogHeader className="items-center gap-2 space-y-0 text-center">
              <DialogTitle className="text-lg font-semibold text-brand-text-heading">
                Log out of CanvasFlow?
              </DialogTitle>
              <DialogDescription className="mx-auto max-w-[18rem] text-balance leading-relaxed">
                We&apos;ll miss you! We will be waiting for you to sign back in
                whenever you&apos;re ready.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="sm:min-w-28 border-0 underline"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                {logoutMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Logging out...
                  </>
                ) : (
                  "Log out"
                )}
              </Button>
              <Button
                type="button"
                className="sm:min-w-28"
                disabled={logoutMutation.isPending}
                onClick={() => setOpen(false)}
              >
                Stay signed in
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
