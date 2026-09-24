import { Link, useNavigate } from '@tanstack/react-router'
import type * as React from 'react'

import type { Theme } from '@/components/theme-provider'
import { useTheme } from '@/components/theme-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuItemLabel,
  MenuSection,
  MenuSub
} from '@/components/ui/menu'
import { Popover } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { toastManager } from '@/components/ui/toast'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { authClient } from '@/lib/auth-client'
import type { AuthUser } from '@/lib/auth-types'

interface UserMenuProps {
  user: AuthUser
}

export function UserMenu({ user }: UserMenuProps) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const avatarFallback = getAvatarFallback(user.name)

  const signOut = async () => {
    const { error } = await authClient.signOut()

    if (error) {
      toastManager.add({
        type: 'error',
        description: error.message || 'Failed to sign out',
      })

      return
    }

    await navigate({ to: '/login', replace: true })
  }

  return (
    <Menu>
      <Tooltip>
        <Button
          variant="quiet"
          isIconOnly
          className="rounded-full"
          aria-label="Account"
        >
          <Avatar className="size-7">
            <AvatarImage src={user.image ?? undefined} alt="" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
        <TooltipContent hideArrow placement="bottom">Open user navigation menu</TooltipContent>
      </Tooltip>
      <Popover placement="bottom start" className="w-64">
        <div className="flex items-center gap-2.5 px-2.5 pt-2.5 pb-2">
          <Avatar className="
            ring-1 ring-border ring-offset-1 ring-offset-popover
          "
          >
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="font-medium">{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-fg-muted" title={user.email}>
              {user.email}
            </span>
          </div>
        </div>
        <Separator />
        <MenuContent>
          <MenuSection>
            <MenuItem
              href="/settings"
              render={props => (
                <Link {...(props as React.ComponentProps<'a'>)} to="/settings" />
              )}
              textValue="Settings"
            >
              <MenuItemLabel>Settings</MenuItemLabel>
            </MenuItem>
            <MenuSub>
              <MenuItem textValue="Appearance">
                <MenuItemLabel>Appearance</MenuItemLabel>
              </MenuItem>
              <Popover className="min-w-40">
                <MenuContent
                  aria-label="Theme"
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={[theme]}
                  onSelectionChange={(keys) => {
                    const [next] = keys

                    if (next) setTheme(next as Theme)
                  }}
                >
                  <MenuItem id="light" textValue="Light">
                    <MenuItemLabel>Light</MenuItemLabel>
                  </MenuItem>
                  <MenuItem id="dark" textValue="Dark">
                    <MenuItemLabel>Dark</MenuItemLabel>
                  </MenuItem>
                  <MenuItem id="system" textValue="System">
                    <MenuItemLabel>System</MenuItemLabel>
                  </MenuItem>
                </MenuContent>
              </Popover>
            </MenuSub>
          </MenuSection>
          <Separator />
          <MenuSection>
            <MenuItem variant="danger" textValue="Sign out" onAction={() => void signOut()}>
              <MenuItemLabel>Sign out</MenuItemLabel>
            </MenuItem>
          </MenuSection>
        </MenuContent>
      </Popover>
    </Menu>
  )
}

/** First user-perceived character, so emoji and CJK names aren't split mid-glyph. */
function getAvatarFallback(name: string) {
  const trimmed = name.trim()

  if (!trimmed) return '?'

  const [first] = new Intl.Segmenter(undefined, {
    granularity: 'grapheme',
  }).segment(trimmed)

  return first.segment.toLocaleUpperCase()
}
