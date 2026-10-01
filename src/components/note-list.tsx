import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import {
  getRouteApi,
  Link as RouterLink,
  useParams
} from '@tanstack/react-router'
import { ArrowDownIcon, ArrowUpIcon, EllipsisIcon } from 'lucide-react'
import type * as React from 'react'
import { useEffect, useId, useRef, useState } from 'react'

import { SaveStatusDot } from '@/components/save-status-dot'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Loader } from '@/components/ui/loader'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuItemLabel,
  MenuSection,
  MenuSectionHeader
} from '@/components/ui/menu'
import { Popover } from '@/components/ui/popover'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { noteListQueryOptions } from '@/data/notes/notes.query'
import type { NoteListQuery } from '@/data/notes/types'
import { useNow } from '@/hooks/use-now'
import { createContext } from '@/lib/context'
import { persistNoteListSort } from '@/lib/note-list.functions'
import { cn } from '@/lib/utils'
import {
  formatNoteTime,
  getDisplayTitle,
  groupNotesByDate
} from '@/utils/notes'
import type { NoteListItem, NoteSortBy } from '@/utils/schemas'

const appRoute = getRouteApi('/_authed/_app')
const notesRoute = getRouteApi('/_authed/_app/notes')

const sortOptions: { id: NoteSortBy, label: string }[] = [
  { id: 'updated-time', label: 'Date updated' },
  { id: 'created-time', label: 'Date created' },
  { id: 'title', label: 'Title' },
]

interface NoteListSortContextValue {
  sort: NoteListQuery
  changeSort: (sort: NoteListQuery) => void
}

const [NoteListSortContext, useNoteListSort]
  = createContext<NoteListSortContextValue>({ name: 'NoteListSortProvider' })

export function NoteListSortProvider({ children }: { children: React.ReactNode }) {
  const { sort: initialSort } = notesRoute.useLoaderData()
  const [sort, setSort] = useState(initialSort)

  const changeSort = (next: NoteListQuery) => {
    setSort(next)
    persistNoteListSort(next)
  }

  return (
    <NoteListSortContext value={{ sort, changeSort }}>
      {children}
    </NoteListSortContext>
  )
}

interface NoteListProps {
  className?: string
  onNavigate?: () => void
}

export function NoteList({ className, onNavigate }: NoteListProps) {
  const headingId = useId()
  const { timeZone, now: loadedNow } = appRoute.useLoaderData()
  const { sort, changeSort } = useNoteListSort('NoteList')
  const { noteId: activeNoteId } = useParams({ strict: false })
  const now = useNow(loadedNow, timeZone)
  const {
    data,
    isPlaceholderData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...noteListQueryOptions(sort),
    placeholderData: keepPreviousData,
  })
  const [dataSort, setDataSort] = useState(sort)

  if (!isPlaceholderData && dataSort !== sort) setDataSort(sort)

  const notes = data?.pages.flatMap(page => page.items) ?? []
  const dateField
    = dataSort.sortBy === 'created-time' ? 'createdAt' : 'updatedAt'
  const groups = dataSort.sortBy === 'title'
    ? null
    : groupNotesByDate(notes, dateField, timeZone, now)
  const sentinelRef = useLoadMoreSentinel(
    fetchNextPage,
    hasNextPage && !isFetchingNextPage
  )
  const DirectionIcon = sort.direction === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <nav aria-labelledby={headingId} className={cn('flex flex-col', className)}>
      <header className="
        flex h-12 shrink-0 items-center justify-between pr-2 pl-4
      "
      >
        <h2 id={headingId} className="text-sm font-medium">All notes</h2>
        <Menu>
          <Tooltip>
            <Button
              variant="quiet"
              size="sm"
              isIconOnly
              aria-label="List options"
              className="text-fg-muted"
            >
              <EllipsisIcon />
            </Button>
            <TooltipContent hideArrow placement="bottom">List options</TooltipContent>
          </Tooltip>
          <Popover placement="bottom end" className="w-48">
            <MenuContent
              aria-label="List options"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[sort.sortBy]}
              onAction={(key) => {
                const sortBy = key as NoteSortBy

                changeSort(
                  sortBy === sort.sortBy
                    ? { sortBy, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
                    : { sortBy, direction: sortBy === 'title' ? 'asc' : 'desc' }
                )
              }}
            >
              <MenuSection>
                <MenuSectionHeader>Sort by</MenuSectionHeader>
                {sortOptions.map(option => (
                  <MenuItem key={option.id} id={option.id} textValue={option.label}>
                    <MenuItemLabel>{option.label}</MenuItemLabel>
                    {option.id === sort.sortBy && (
                      <DirectionIcon className="size-3.5 text-fg-muted" />
                    )}
                  </MenuItem>
                ))}
              </MenuSection>
            </MenuContent>
          </Popover>
        </Menu>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {groups
          ? (
              <ul className="flex flex-col p-2 pt-0">
                {groups.map(group => (
                  <li key={group.label}>
                    <h3 className="
                      sticky top-0 z-10 bg-bg px-2 pt-3 pb-1.5 font-sans text-xs
                      text-fg-muted
                    "
                    >
                      {group.label}
                    </h3>
                    <ul className="flex flex-col gap-px">
                      {group.notes.map(note => (
                        <NoteLink
                          key={note.id}
                          note={note}
                          date={note[dateField]}
                          label={group.format.format(note[dateField])}
                          isActive={note.id === activeNoteId}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )
          : (
              <ul className="flex flex-col gap-px p-2">
                {notes.map(note => (
                  <NoteLink
                    key={note.id}
                    note={note}
                    date={note.updatedAt}
                    label={formatNoteTime(note.updatedAt, timeZone, now)}
                    isActive={note.id === activeNoteId}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            )}
        {hasNextPage && (
          <div ref={sentinelRef} className="flex justify-center py-2">
            {isFetchingNextPage && <Loader />}
          </div>
        )}
      </div>
    </nav>
  )
}

interface NoteLinkProps {
  note: NoteListItem
  date: Date
  label: string
  isActive: boolean
  onNavigate?: () => void
}

function NoteLink({ note, date, label, isActive, onNavigate }: NoteLinkProps) {
  return (
    <li>
      <Link
        variant="unstyled"
        href={`/notes/${note.id}`}
        onPress={onNavigate}
        render={props => (
          <RouterLink
            {...(props as React.ComponentProps<'a'>)}
            to="/notes/$noteId"
            params={{ noteId: note.id }}
          />
        )}
        className="
          flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm
          hover:bg-muted
          data-[status=active]:bg-muted
          pressed:bg-muted
        "
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-medium">{getDisplayTitle(note.title)}</span>
          <time dateTime={date.toISOString()} className="text-xs">
            {label}
          </time>
        </span>
        {isActive && <SaveStatusDot noteId={note.id} />}
      </Link>
    </li>
  )
}

function useLoadMoreSentinel(onLoadMore: () => unknown, isEnabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current

    if (!element || !isEnabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting)) onLoadMore()
      },
      { rootMargin: '200px' }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [onLoadMore, isEnabled])

  return ref
}
