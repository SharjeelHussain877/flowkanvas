"use client"

import {
  ChevronDown,
  FolderKanban,
  History,
  Workflow,
} from "lucide-react"
import Link from "next/link"
import { memo, useState } from "react"

import { BrandLogo } from "@/components/brand-logo"
import { SidebarNavLink } from "@/components/dashboard/sidebar-nav-link"
import { SidebarUserMenu } from "@/components/dashboard/sidebar-user-menu"
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
} from "@/components/ui/sidebar"
import { recentDraftTemplates } from "@/lib/dashboard/mock-data"
import { dashboardRoutes } from "@/lib/dashboard/routes"

function AppSidebarComponent() {
  const [recentsOpen, setRecentsOpen] = useState(true)

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-12 overflow-visible group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!h-12 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:justify-center data-[state=open]:bg-sidebar-accent"
            >
              <Link
                href={dashboardRoutes.requests}
                className="flex h-12 w-full min-w-0 items-center overflow-visible group-data-[collapsible=icon]:justify-center"
              >
                <span className="flex h-12 w-full min-w-0 items-center justify-start px-1 group-data-[collapsible=icon]:hidden">
                  <BrandLogo
                    priority
                    className="h-full max-h-12 w-full object-contain object-left"
                  />
                </span>
                <span className="hidden h-12 w-full items-center justify-center p-1 group-data-[collapsible=icon]:flex">
                  <BrandLogo
                    variant="square"
                    priority
                    className="h-full max-h-12 w-full object-contain"
                  />
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
                  href={dashboardRoutes.projects}
                  title="Projects"
                  icon={<FolderKanban />}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <ScrollArea className="flex-1 [&>[data-slot=scroll-area-viewport]>div]:!block">
          <SidebarGroup className="py-0">
            <Collapsible open={recentsOpen} onOpenChange={setRecentsOpen}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-2">
                  <History className="size-4 shrink-0" />
                  <span className="flex-1 truncate text-start">Recents</span>
                  <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <p className="px-2 pb-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                All drafts template
              </p>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuSub>
                      {recentDraftTemplates.map((template) => (
                        <SidebarMenuSubItem key={template.slug}>
                          <SidebarNavLink
                            href={dashboardRoutes.template(template.slug)}
                            title={template.title}
                            nested
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}

export const AppSidebar = memo(AppSidebarComponent)
