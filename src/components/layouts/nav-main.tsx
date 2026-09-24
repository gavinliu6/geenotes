import type { LinkProps } from '@tanstack/react-router'
import { Link, useMatchRoute } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { HomeIcon, SearchIcon, StickyNotesIcon } from 'lucide-react'
import type * as React from 'react'

import { SearchCommand } from '@/components/search-command'
import { Kbd } from '@/components/ui/kbd'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <NavLink label="Home" icon={HomeIcon} to="/home" />
        <SidebarMenuItem>
          <SearchCommand>
            <SidebarMenuButton tooltip="Search">
              <SearchIcon className="text-fg-muted" />
              <span className="text-fg">Search</span>
              <Kbd className="
                ml-auto
                group-data-[collapsible=icon]:hidden
              "
              >⌘K
              </Kbd>
            </SidebarMenuButton>
          </SearchCommand>
        </SidebarMenuItem>
        <NavLink label="All notes" icon={StickyNotesIcon} to="/notes" />
      </SidebarMenu>
    </SidebarGroup>
  )
}

interface NavLinkProps {
  label: string
  icon: LucideIcon
  to: LinkProps['to']
}

function NavLink({ label, icon: Icon, to }: NavLinkProps) {
  const matchRoute = useMatchRoute()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        href={to}
        render={props => (
          <Link {...(props as React.ComponentProps<'a'>)} to={to} />
        )}
        isActive={!!matchRoute({ to, fuzzy: true })}
        tooltip={label}
      >
        <Icon className="text-fg-muted" />
        <span className="text-fg">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
