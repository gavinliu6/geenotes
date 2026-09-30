import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  SearchIcon,
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
import { Input, InputGroup, InputGroupAddon } from '@/components/ui/input'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Loader } from '@/components/ui/loader'
import {
  ModalBackdrop,
  ModalOverlay,
  ModalPanel,
  ModalViewport
} from '@/components/ui/modal'
import {
  noteListQueryOptions,
  noteSearchQueryOptions,
  recentNoteListQueryOptions
} from '@/data/notes/notes.query'
import { getDisplayTitle } from '@/utils/notes'
import type { NoteListItem } from '@/utils/schemas'

const RECENTLY_EDITED_LIMIT = 5
const SEARCH_DEBOUNCE_MS = 250

export function SearchCommand({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

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
      <ModalOverlay>
        <ModalBackdrop />
        <ModalViewport className="
          items-start pt-4
          sm:pt-[calc(var(--visual-viewport-height)*0.12)]
        "
        >
          <ModalPanel className="
            origin-top
            sm:max-h-[calc(var(--visual-viewport-height)*0.76)] sm:max-w-2xl
          "
          >
            <DialogContent aria-label="Search notes">
              <SearchPalette onClose={() => setIsOpen(false)} />
            </DialogContent>
          </ModalPanel>
        </ModalViewport>
      </ModalOverlay>
    </Dialog>
  )
}

function SearchPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState('')
  const [term, setTerm] = useState('')
  const [showMatches, setShowMatches] = useState(false)
  const typed = inputValue.trim()
  const { data: recentlyViewed } = useQuery(recentNoteListQueryOptions())
  const { data: edited } = useInfiniteQuery(
    noteListQueryOptions({ sortBy: 'updated-time', direction: 'desc' })
  )
  const { data: matches, isPlaceholderData, isFetching } = useQuery({
    ...noteSearchQueryOptions(term),
    enabled: term !== '',
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (typed === '') return

    const id = setTimeout(() => setTerm(typed), SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(id)
  }, [typed])

  if (typed === '' && term !== '') setTerm('')
  if (term === '' && showMatches) setShowMatches(false)
  if (term !== '' && matches && !isPlaceholderData && !showMatches) {
    setShowMatches(true)
  }

  const isSearching = typed !== '' && (typed !== term || isFetching)
  const lastOpened = recentlyViewed?.at(0)
  const recentlyEdited
    = edited?.pages
      .flatMap(page => page.items)
      .filter(note => note.id !== lastOpened?.id)
      .slice(0, RECENTLY_EDITED_LIMIT) ?? []
  const shownMatches = showMatches ? (matches ?? []) : null
  const firstNote = shownMatches
    ? shownMatches.at(0)
    : (lastOpened ?? recentlyEdited.at(0))

  return (
    <Command shouldFilter={false}>
      <CommandInput aria-label="Search notes" autoFocus onChange={setInputValue}>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <Input placeholder="Search notes..." />
          {isSearching && (
            <InputGroupAddon>
              <Loader aria-label="Searching" />
            </InputGroupAddon>
          )}
        </InputGroup>
      </CommandInput>
      <CommandContent
        key={firstNote?.id}
        autoFocus="first"
        onAction={(key) => {
          onClose()

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
        {shownMatches
          ? (
              shownMatches.length > 0 && (
                <CommandSection>
                  <CommandSectionHeader>Results</CommandSectionHeader>
                  {shownMatches.map(note => (
                    <NoteItem key={note.id} note={note} />
                  ))}
                </CommandSection>
              )
            )
          : (
              <>
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
              </>
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
