"use client"

import type { ReactNode } from "react"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardLogoutButton } from "@/components/dashboard/logout-button"
import type { SidebarUser } from "@/components/dashboard/sidebar-user-menu"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type DashboardShellProps = {
  children: ReactNode
  user: SidebarUser
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar user={user} />
      <SidebarInset className="min-h-svh bg-brand-background font-sans">
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
          <SidebarTrigger className="-ms-1" />
          <span className="text-sm text-sidebar-foreground/70">Dashboard</span>
          <div className="ms-auto">
            <DashboardLogoutButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
