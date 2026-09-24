import {
  ArrowLeftFromLineIcon,
  ArrowRightFromLineIcon,
  StickyNotePlusIcon
} from 'lucide-react'

import { NewNoteButton } from '@/components/new-note-button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import type { AuthUser } from '@/lib/auth-types'
import { cn } from '@/lib/utils'

import { NavMain } from './nav-main'
import { UserMenu } from './user-menu'

interface AppSidebarProps {
  user: AuthUser
}

export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="
          relative h-8 transition-[height] duration-250 ease-fluid-out
          group-data-[collapsible=icon]:h-19
        "
        >
          <UserMenu user={user} />
          <div className="
            absolute top-0.5 right-0 transition-[top,right] duration-250
            ease-fluid-out
            group-data-[collapsible=icon]:top-12
            group-data-[collapsible=icon]:right-0.5
          "
          >
            <Tooltip>
              <NewNoteButton
                variant="primary"
                size="sm"
                isIconOnly
                aria-label="New note"
              >
                <StickyNotePlusIcon />
              </NewNoteButton>
              <TooltipContent hideArrow placement="bottom">New note</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="relative">
        <CollapseButton className="absolute right-px bottom-px" />
      </SidebarFooter>
    </Sidebar>
  )
}

interface CollapseButtonProps {
  className?: string
}

function CollapseButton({ className }: CollapseButtonProps) {
  const { state, isMobile } = useSidebar()
  const isOpen = isMobile || state === 'expanded'
  const label = isMobile
    ? 'Close sidebar'
    : isOpen
      ? 'Collapse sidebar'
      : 'Expand sidebar'

  return (
    <Tooltip>
      <SidebarTrigger
        aria-label={label}
        className={cn('text-fg-muted', className)}
      >
        {isOpen ? <ArrowLeftFromLineIcon /> : <ArrowRightFromLineIcon />}
      </SidebarTrigger>
      <TooltipContent hideArrow placement="top">{label}</TooltipContent>
    </Tooltip>
  )
}
