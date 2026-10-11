import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { EllipsisIcon, FolderIcon, FolderOpenIcon, FolderPlusIcon } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'

import { DeleteFolderDialog } from '@/components/delete-folder-dialog'
import { FolderNameDialog } from '@/components/folder-name-dialog'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuItemLabel
} from '@/components/ui/menu'
import { Popover } from '@/components/ui/popover'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { folderListQueryOptions } from '@/data/folders/folders.query'
import { useCurrentNoteScope } from '@/data/notes/scope'
import type { FolderListItem } from '@/utils/schemas'

export function NavFolders() {
  const { data: folders } = useSuspenseQuery(folderListQueryOptions())
  const scope = useCurrentNoteScope()
  const activeFolderId = scope.kind === 'folder' ? scope.folderId : undefined
  const [createOpen, setCreateOpen] = useState(false)
  const [renaming, setRenaming] = useState<FolderListItem | null>(null)
  const [deleting, setDeleting] = useState<FolderListItem | null>(null)

  return (
    // The desktop icon rail keeps Home, Search, and All notes only.
    // This group stays visible in the expanded sidebar and the mobile drawer.
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Folders</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {folders.map(folder => (
            <FolderRow
              key={folder.id}
              folder={folder}
              isActive={folder.id === activeFolderId}
              onRename={() => setRenaming(folder)}
              onDelete={() => setDeleting(folder)}
            />
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              id="add-folder"
              tooltip="Add folder"
              onPress={() => setCreateOpen(true)}
            >
              <FolderPlusIcon className="text-fg-muted" />
              <span>Add folder</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
      <FolderNameDialog mode="create" isOpen={createOpen} onOpenChange={setCreateOpen} />
      <FolderNameDialog
        mode="rename"
        folder={renaming}
        isOpen={renaming !== null}
        onOpenChange={(open) => {
          if (open) return

          const folderId = renaming?.id

          setRenaming(null)
          focusFolder(folderId)
        }}
      />
      <DeleteFolderDialog
        folder={deleting}
        isOpen={deleting !== null}
        onOpenChange={(open) => {
          if (open) return

          setDeleting(null)
          focusFolder()
        }}
      />
    </SidebarGroup>
  )
}

interface FolderRowProps {
  folder: FolderListItem
  isActive: boolean
  onRename: () => void
  onDelete: () => void
}

function FolderRow({ folder, isActive, onRename, onDelete }: FolderRowProps) {
  const matchRoute = useMatchRoute()
  const onNotes = !!matchRoute({ to: '/notes', fuzzy: true })
  const active = onNotes && isActive
  const FolderGlyph = active ? FolderOpenIcon : FolderIcon

  return (
    // The action keeps a fixed slot to the left of the count. Hover reveals
    // it without shifting the number.
    <SidebarMenuItem className="
      grid min-w-0 grid-cols-[auto_minmax(0,1fr)_1.25rem_auto] items-center
      gap-x-2
    "
    >
      <SidebarMenuButton
        id={`folder-link-${folder.id}`}
        href={`/notes?folder=${folder.id}`}
        tooltip={folder.name}
        isActive={active}
        className="
          col-span-full row-start-1 grid grid-cols-subgrid items-center gap-x-2
          p-0!
        "
        render={props => (
          <Link
            {...(props as React.ComponentProps<'a'>)}
            to="/notes"
            search={{ folder: folder.id }}
          />
        )}
      >
        <FolderGlyph className="ml-2 text-fg-muted" />
        <span className="col-start-2 min-w-0 truncate" title={folder.name}>{folder.name}</span>
        <span className="
          col-start-4 mr-3 text-xs text-fg-muted tabular-nums
          group-data-[collapsible=icon]:hidden
        "
        >
          {folder.noteCount}
        </span>
      </SidebarMenuButton>
      <Menu>
        <SidebarMenuAction
          showOnHover
          aria-label={`Actions for ${folder.name}`}
          className="static! z-10 col-start-3 row-start-1 self-center"
        >
          <EllipsisIcon />
        </SidebarMenuAction>
        <Popover placement="bottom start">
          <MenuContent aria-label={`Actions for ${folder.name}`}>
            <MenuItem textValue="Rename" onAction={onRename}>
              <MenuItemLabel>Rename</MenuItemLabel>
            </MenuItem>
            <MenuItem variant="danger" textValue="Delete" onAction={onDelete}>
              <MenuItemLabel>Delete</MenuItemLabel>
            </MenuItem>
          </MenuContent>
        </Popover>
      </Menu>
    </SidebarMenuItem>
  )
}

function focusFolder(folderId?: string) {
  requestAnimationFrame(() => {
    const element = document.getElementById(
      folderId ? `folder-link-${folderId}` : 'add-folder'
    )

    element?.focus()
  })
}
