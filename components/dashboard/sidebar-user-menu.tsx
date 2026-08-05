"use client"

import {
  KeyRound,
  Settings2,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { memo } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { dashboardSettingsNav } from "@/lib/dashboard/routes"
import { cn } from "@/lib/utils"

export type SidebarUser = {
  name: string
  email: string
  initials: string
  avatarUrl: string | null
}

const settingsIcons = {
  Settings: Settings2,
  "API Keys": KeyRound,
} as const

type SidebarUserMenuProps = {
  user: SidebarUser
}

function SidebarUserMenuComponent({ user }: SidebarUserMenuProps) {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user.name}
              className="outline-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-brand-teal/15 text-brand-teal">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="min-w-(--radix-dropdown-menu-trigger-width) w-(--radix-dropdown-menu-trigger-width) max-w-(--radix-dropdown-menu-trigger-width) p-1.5"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="size-8 rounded-lg">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-brand-teal/15 text-brand-teal">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuGroup className="flex flex-col gap-1">
              {dashboardSettingsNav.map((item) => {
                const Icon =
                  settingsIcons[item.title as keyof typeof settingsIcons]
                const isActive = pathname === item.href

                return (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className="gap-2.5 rounded-md px-2 py-1.5 focus:bg-muted/50 focus:text-foreground"
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "cursor-pointer",
                        isActive && "bg-muted/60 text-foreground"
                      )}
                    >
                      <Icon />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export const SidebarUserMenu = memo(SidebarUserMenuComponent)
