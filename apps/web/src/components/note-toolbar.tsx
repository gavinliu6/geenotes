import {
  Copy,
  Ellipsis,
  Link,
  Markdown,
  PageTextEdit,
  PageTextLock,
  Trash
} from '@/components/icons'
import { NoteListDrawer } from '@/components/note-list-drawer'
import { ShareNoteButton } from '@/components/share-note-button'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuItemLabel,
  MenuSection
} from '@/components/ui/menu'
import { Popover } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { switchStyles } from '@/components/ui/switch'
import { toastManager } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { toNoteMarkdown } from '@/utils/notes'
import type { Note } from '@/utils/schemas'

const { indicator, thumb } = switchStyles()

interface NoteToolbarProps {
  className?: string
  note: Pick<Note, 'id' | 'title' | 'markdown' | 'sharedAt'>
  isLocked: boolean
  onLockedChange: (isLocked: boolean) => void
  onDelete: () => void
}

export function NoteToolbar({
  className,
  note,
  isLocked,
  onLockedChange,
  onDelete,
}: NoteToolbarProps) {
  return (
    <div
      className={cn(
        'flex h-12 shrink-0 items-center justify-between px-6',
        className
      )}
    >
      <div className="md:hidden">
        <NoteListDrawer />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ShareNoteButton note={note} />
        <NoteActions
          note={note}
          isLocked={isLocked}
          onLockedChange={onLockedChange}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

function NoteActions({
  note,
  isLocked,
  onLockedChange,
  onDelete,
}: Omit<NoteToolbarProps, 'className'>) {
  const copy = async (text: string, copied: string, failed: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toastManager.add({ type: 'success', description: copied })
    } catch {
      toastManager.add({ type: 'error', description: failed })
    }
  }

  const copyLink = () => {
    void copy(
      `${window.location.origin}/notes/${note.id}`,
      'Link copied',
      'Failed to copy link'
    )
  }

  const copyContents = () => {
    void copy(
      toNoteMarkdown(note),
      'Page contents copied',
      'Failed to copy page contents'
    )
  }

  const confirmDelete = () => {
    if (window.confirm('Delete this note? This cannot be undone.')) onDelete()
  }

  return (
    <Menu>
      <Button
        variant="quiet"
        size="sm"
        isIconOnly
        aria-label="More actions"
        className="text-fg-muted"
      >
        <Ellipsis />
      </Button>
      <Popover placement="bottom end">
        <MenuContent>
          <MenuItem textValue="Copy link" onAction={copyLink}>
            <Link />
            <MenuItemLabel>Copy link</MenuItemLabel>
          </MenuItem>
          <MenuItem textValue="Copy page contents" onAction={copyContents}>
            <Copy />
            <MenuItemLabel>Copy page contents</MenuItemLabel>
          </MenuItem>
          <MenuItem
            href={`/notes/${note.id}.md`}
            target="_blank"
            textValue="View as Markdown"
          >
            <Markdown />
            <MenuItemLabel>View as Markdown</MenuItemLabel>
          </MenuItem>
          <Separator />
          <MenuSection
            selectionMode="multiple"
            selectedKeys={isLocked ? ['read-only'] : []}
          >
            <MenuItem
              id="read-only"
              textValue="Read-only"
              className="
                *:data-menu-item-indicator:hidden
                data-selection-mode:pr-1.5
              "
              onAction={() => onLockedChange(!isLocked)}
            >
              {isLocked ? <PageTextLock /> : <PageTextEdit />}
              <MenuItemLabel>Read-only</MenuItemLabel>
              <span
                aria-hidden
                data-selected={isLocked || undefined}
                className={indicator({
                  size: 'sm',
                  className: `
                    ml-auto
                    in-data-focus-visible:not-data-selected:bg-neutral-active
                    in-data-hovered:not-data-selected:bg-neutral-active
                  `,
                })}
              >
                <span
                  data-selected={isLocked || undefined}
                  className={thumb({ size: 'sm' })}
                />
              </span>
            </MenuItem>
          </MenuSection>
          <Separator />
          <MenuItem variant="danger" textValue="Delete" onAction={confirmDelete}>
            <Trash />
            <MenuItemLabel>Delete</MenuItemLabel>
          </MenuItem>
        </MenuContent>
      </Popover>
    </Menu>
  )
}
