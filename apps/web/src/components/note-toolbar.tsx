import { ArrowsInLineHorizontalIcon, ArrowsOutLineHorizontalIcon } from '@phosphor-icons/react'
import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { COPIED_DURATION } from '@/components/editor/copy-feedback'
import { Check, Copy, Markdown, Trash } from '@/components/icons'
import { NoteListDrawer } from '@/components/note-list-drawer'
import { Button } from '@/components/ui/button'
import { Group } from '@/components/ui/group'
import { Menu, MenuContent, MenuItem, MenuItemLabel } from '@/components/ui/menu'
import { Popover } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { toastManager } from '@/components/ui/toast'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toNoteMarkdown } from '@/utils/notes'
import type { Note } from '@/utils/schemas'

interface NoteToolbarProps {
  className?: string
  note: Pick<Note, 'id' | 'title' | 'markdown'>
  isFullWidth: boolean
  onFullWidthChange: (isFullWidth: boolean) => void
  onDelete: () => void
}

export function NoteToolbar({
  className,
  note,
  isFullWidth,
  onFullWidthChange,
  onDelete,
}: NoteToolbarProps) {
  const widthToggleLabel = isFullWidth ? 'Constrain width' : 'Expand width'

  return (
    <div
      className={cn(
        `
          flex h-12 shrink-0 items-center justify-between pr-4 pl-6
          [@container_(width<=42rem)]:pr-6
        `,
        className
      )}
    >
      <div className="md:hidden">
        <NoteListDrawer />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <PageActions note={note} onDelete={onDelete} />
        <Tooltip>
          <Button
            variant="quiet"
            size="sm"
            isIconOnly
            aria-label={widthToggleLabel}
            className="
              text-fg-muted
              [@container_(width<=42rem)]:hidden
            "
            onPress={() => onFullWidthChange(!isFullWidth)}
          >
            {isFullWidth
              ? <ArrowsInLineHorizontalIcon className="size-4" />
              : <ArrowsOutLineHorizontalIcon className="size-4" />}
          </Button>
          <TooltipContent
            hideArrow
            placement="bottom"
          >{widthToggleLabel}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function PageActions({
  note,
  onDelete,
}: Pick<NoteToolbarProps, 'note' | 'onDelete'>) {
  const [copiedAt, setCopiedAt] = useState<number>()
  const isCopied = copiedAt !== undefined

  useEffect(() => {
    if (copiedAt === undefined) return

    const timeout = setTimeout(() => setCopiedAt(undefined), COPIED_DURATION)

    return () => clearTimeout(timeout)
  }, [copiedAt])

  const copyPage = async () => {
    try {
      await navigator.clipboard.writeText(toNoteMarkdown(note))
      setCopiedAt(Date.now())
    } catch {
      toastManager.add({ type: 'error', description: 'Failed to copy page' })
    }
  }

  const confirmDelete = () => {
    if (window.confirm('Delete this note? This cannot be undone.')) onDelete()
  }

  return (
    <Group aria-label="Page actions">
      <Button variant="outline" size="sm" onPress={copyPage}>
        <span className="copy-feedback" data-copied={isCopied || undefined}>
          <Copy className="text-fg-muted" />
          <Check />
        </span>
        Copy page
      </Button>
      <Menu>
        <Button variant="outline" size="sm" isIconOnly aria-label="More page actions">
          <ChevronDownIcon className="text-fg-muted" />
        </Button>
        <Popover placement="bottom end">
          <MenuContent>
            <MenuItem
              href={`/notes/${note.id}.md`}
              target="_blank"
              textValue="View as Markdown"
            >
              <Markdown />
              <MenuItemLabel>View as Markdown</MenuItemLabel>
            </MenuItem>
            <Separator />
            <MenuItem variant="danger" textValue="Delete" onAction={confirmDelete}>
              <Trash />
              <MenuItemLabel>Delete</MenuItemLabel>
            </MenuItem>
          </MenuContent>
        </Popover>
      </Menu>
    </Group>
  )
}
