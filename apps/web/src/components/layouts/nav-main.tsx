import { useSuspenseQuery } from '@tanstack/react-query'
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
import { noteCountQueryOptions } from '@/data/notes/notes.query'
import { useCurrentNoteScope } from '@/data/notes/scope'

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
        <AllNotesLink />
      </SidebarMenu>
    </SidebarGroup>
  )
}

interface NavLinkProps {
  label: string
  icon: LucideIcon
  to: LinkProps['to']
}

function AllNotesLink() {
  const matchRoute = useMatchRoute()
  const scope = useCurrentNoteScope()
  const onNotes = !!matchRoute({ to: '/notes', fuzzy: true })
  const { data: noteCount } = useSuspenseQuery(noteCountQueryOptions())

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        href="/notes"
        render={props => (
          <Link
            {...(props as React.ComponentProps<'a'>)}
            to="/notes"
            search={{}}
          />
        )}
        isActive={onNotes && scope.kind === 'all'}
        tooltip="All notes"
      >
        <StickyNotesIcon className="text-fg-muted" />
        <span className="text-fg">All notes</span>
        <span className="
          mr-1 ml-auto text-xs text-fg-muted tabular-nums
          group-data-[collapsible=icon]:hidden
        "
        >
          {noteCount}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
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
