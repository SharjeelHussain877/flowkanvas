"use client"

import {
  ChevronDown,
  History,
  LayoutTemplate,
  Workflow,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { memo, useEffect, useState } from "react"

import { BrandLogo } from "@/components/brand-logo"
import { SidebarNavLink } from "@/components/dashboard/sidebar-nav-link"
import {
  SidebarUserMenu,
  type SidebarUser,
} from "@/components/dashboard/sidebar-user-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { apiClient } from "@/lib/api/client"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { queryKeys } from "@/lib/query/keys"
import type { TemplatesListResponse } from "@/schemas/templates/template"
import { cn } from "@/lib/utils"

type AppSidebarProps = {
  user: SidebarUser
}

const RECENT_TEMPLATE_LIMIT = 12

function AppSidebarComponent({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const { setOpenMobile, state } = useSidebar()
  const [recentsOpen, setRecentsOpen] = useState(true)
  const isCollapsed = state === "collapsed"

  const templatesQuery = useQuery({
    queryKey: queryKeys.templates.list(),
    queryFn: () => apiClient<TemplatesListResponse>("/api/templates"),
    select: (response) => response.data.slice(0, RECENT_TEMPLATE_LIMIT),
  })
  const recentTemplates = templatesQuery.data ?? []

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="flex h-12 shrink-0 items-center border-b border-sidebar-border p-0 px-2">
        <SidebarMenu className="h-full w-full">
          <SidebarMenuItem className="h-full w-full">
            <SidebarMenuButton
              asChild
              size="lg"
              className={cn(
                "h-full w-full gap-0 p-0 hover:bg-sidebar-accent",
                "group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!h-full group-data-[collapsible=icon]:!w-full"
              )}
            >
              <Link
                href={dashboardRoutes.requests}
                aria-label="flowkanvas home"
                className="flex h-full w-full min-w-0 items-center justify-start group-data-[collapsible=icon]:justify-center"
              >
                <BrandLogo
                  variant={isCollapsed ? "square" : "full"}
                  priority
                  className={cn(
                    "h-full max-h-12 w-full object-contain",
                    isCollapsed ? "object-center" : "object-left"
                  )}
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <SidebarGroup className="shrink-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarNavLink
                  href={dashboardRoutes.requests}
                  title="Requests"
                  icon={<Workflow />}
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarNavLink
                  href={dashboardRoutes.templates}
                  title="Templates"
                  icon={<LayoutTemplate />}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="shrink-0" />

        <SidebarGroup className="flex min-h-0 flex-1 flex-col py-0">
          <Collapsible
            open={recentsOpen}
            onOpenChange={setRecentsOpen}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SidebarGroupLabel asChild className="shrink-0">
              <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-2">
                <History className="size-4 shrink-0" />
                <span className="flex-1 truncate text-start">Recents</span>
                <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <p className="shrink-0 px-2 pb-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              Recently edited templates
            </p>
            <CollapsibleContent className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full [&>[data-slot=scroll-area-viewport]>div]:!block">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuSub>
                      {recentTemplates.length === 0 && !templatesQuery.isPending ? (
                        <li className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                          No templates yet
                        </li>
                      ) : null}
                      {recentTemplates.map((template) => (
                        <SidebarMenuSubItem key={template.id}>
                          <SidebarNavLink
                            href={dashboardRoutes.template(template.id)}
                            title={template.name}
                            nested
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenu>
                </SidebarGroupContent>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarUserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

export const AppSidebar = memo(AppSidebarComponent)
