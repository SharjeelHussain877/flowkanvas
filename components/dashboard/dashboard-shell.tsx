"use client"

import type { ReactNode } from "react"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardLogoutButton } from "@/components/dashboard/logout-button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-brand-background font-sans">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-white px-4">
          <SidebarTrigger className="-ms-1" />
          <span className="text-sm text-muted-foreground">Dashboard</span>
          <div className="ms-auto">
            <DashboardLogoutButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
