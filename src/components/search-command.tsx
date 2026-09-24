import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  StickyNoteIcon
} from 'lucide-react'
import type * as React from 'react'
import { useEffect, useState } from 'react'

import {
  Command,
  CommandContent,
  CommandInput,
  CommandItem,
  CommandSection,
  CommandSectionHeader
} from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Modal } from '@/components/ui/modal'
import {
  noteListQueryOptions,
  recentNoteListQueryOptions
} from '@/data/notes/notes.query'
import { getDisplayTitle } from '@/utils/notes'
import type { NoteListItem } from '@/utils/schemas'

const RECENTLY_EDITED_LIMIT = 5

export function SearchCommand({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { data: recentlyViewed } = useQuery({
    ...recentNoteListQueryOptions(),
    enabled: isOpen,
  })
  const { data: edited } = useInfiniteQuery({
    ...noteListQueryOptions({ sortBy: 'updated-time', direction: 'desc' }),
    enabled: isOpen,
  })
  const lastOpened = recentlyViewed?.at(0)
  const recentlyEdited
    = edited?.pages
      .flatMap(page => page.items)
      .filter(note => note.id !== lastOpened?.id)
      .slice(0, RECENTLY_EDITED_LIMIT) ?? []
  const firstNote = lastOpened ?? recentlyEdited.at(0)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setIsOpen(open => !open)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      {children}
      <Modal className="sm:max-w-2xl">
        <DialogContent aria-label="Search notes">
          <Command>
            <CommandInput
              aria-label="Search notes"
              placeholder="Search notes..."
              autoFocus
            />
            <CommandContent
              key={firstNote?.id}
              autoFocus="first"
              onAction={(key) => {
                setIsOpen(false)

                void navigate({
                  to: '/notes/$noteId',
                  params: { noteId: String(key) },
                })
              }}
              renderEmptyState={() => (
                <div className="py-6 text-center text-sm text-fg-muted">
                  No notes found.
                </div>
              )}
            >
              {lastOpened && (
                <CommandSection>
                  <CommandSectionHeader>Last opened</CommandSectionHeader>
                  <NoteItem key={lastOpened.id} note={lastOpened} />
                </CommandSection>
              )}
              {recentlyEdited.length > 0 && (
                <CommandSection>
                  <CommandSectionHeader>Recently edited</CommandSectionHeader>
                  {recentlyEdited.map(note => (
                    <NoteItem key={note.id} note={note} />
                  ))}
                </CommandSection>
              )}
            </CommandContent>
            <footer
              className="
                flex shrink-0 items-center gap-4 border-t px-4 py-2 text-xs
                text-fg-muted
                max-md:hidden
              "
            >
              <span className="flex items-center gap-1.5">
                <KbdGroup>
                  <Kbd aria-label="Up arrow">
                    <ArrowUpIcon />
                  </Kbd>
                  <Kbd aria-label="Down arrow">
                    <ArrowDownIcon />
                  </Kbd>
                </KbdGroup>
                to navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd aria-label="Enter">
                  <CornerDownLeftIcon />
                </Kbd>
                to select
              </span>
            </footer>
          </Command>
        </DialogContent>
      </Modal>
    </Dialog>
  )
}

function NoteItem({ note }: { note: NoteListItem }) {
  const title = getDisplayTitle(note.title)

  return (
    <CommandItem id={note.id} textValue={title} className="group/item">
      <StickyNoteIcon />
      <span className="truncate">{title}</span>
      <ArrowRightIcon className="
        ml-auto opacity-0
        group-focus/item:opacity-100
      "
      />
    </CommandItem>
  )
}
