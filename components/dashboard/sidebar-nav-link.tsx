"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { memo } from "react"

import {
  SidebarMenuButton,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type SidebarNavLinkProps = {
  href: string
  title: string
  icon?: React.ReactNode
  exact?: boolean
  nested?: boolean
  className?: string
}

function SidebarNavLinkComponent({
  href,
  title,
  icon,
  exact = true,
  nested = false,
  className,
}: SidebarNavLinkProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  const ButtonComponent = nested ? SidebarMenuSubButton : SidebarMenuButton

  return (
    <ButtonComponent
      asChild
      isActive={isActive}
      tooltip={nested ? undefined : title}
      className={cn(className)}
    >
      <Link href={href}>
        {icon}
        <span>{title}</span>
      </Link>
    </ButtonComponent>
  )
}

export const SidebarNavLink = memo(SidebarNavLinkComponent)
