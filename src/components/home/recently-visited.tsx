import { useSuspenseQuery } from '@tanstack/react-query'
import { Link as RouterLink } from '@tanstack/react-router'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
  StickyNoteIcon
} from 'lucide-react'
import type * as React from 'react'
import { useEffect, useRef, useState } from 'react'

import { HomeSection } from '@/components/home/home-section'
import { NewNoteButton } from '@/components/new-note-button'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { recentNoteListQueryOptions } from '@/data/notes/notes.query'
import { cn } from '@/lib/utils'
import { formatRelativeTime, getDisplayTitle } from '@/utils/notes'
import type { RecentNoteListItem } from '@/utils/schemas'

const coverTints = [
  'from-cover-rose/60 to-cover-rose text-fg-cover-rose',
  'from-cover-sky/60 to-cover-sky text-fg-cover-sky',
  'from-cover-amber/60 to-cover-amber text-fg-cover-amber',
  'from-cover-violet/60 to-cover-violet text-fg-cover-violet',
  'from-cover-green/60 to-cover-green text-fg-cover-green',
  'from-cover-orange/60 to-cover-orange text-fg-cover-orange',
  'from-cover-blue/60 to-cover-blue text-fg-cover-blue',
  'from-cover-lime/60 to-cover-lime text-fg-cover-lime',
  'from-cover-pink/60 to-cover-pink text-fg-cover-pink',
  'from-cover-teal/60 to-cover-teal text-fg-cover-teal',
]

interface RecentlyVisitedProps {
  now: Date
  timeZone: string
}

export function RecentlyVisited({ now, timeZone }: RecentlyVisitedProps) {
  const { data: notes } = useSuspenseQuery(recentNoteListQueryOptions())
  const tints = assignCoverTints(notes.map(note => note.id))
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { canScrollLeft, canScrollRight } = useScrollEdges(scrollerRef)

  const scrollPage = (direction: -1 | 1) => {
    const scroller = scrollerRef.current

    if (!scroller) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.8,
      behavior: reduceMotion ? 'instant' : 'smooth',
    })
  }

  return (
    <HomeSection id="recently-viewed" title="Recently viewed" icon={ClockIcon}>
      <div className="group/carousel relative">
        <div
          ref={scrollerRef}
          className="
            -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto
            overscroll-x-contain px-6 py-2 [--scrollbar-width:none]
          "
        >
          <ul className="
            flex gap-3
            empty:hidden
          "
          >
            {notes.map((note, index) => (
              <li key={note.id} className="snap-start">
                <NoteCard
                  note={note}
                  tint={tints[index]}
                  label={formatRelativeTime(note.viewedAt, timeZone, now)}
                />
              </li>
            ))}
          </ul>
          <NewNoteCard />
        </div>
        {canScrollLeft && (
          <ScrollButton direction="left" onPress={() => scrollPage(-1)} />
        )}
        {canScrollRight && (
          <ScrollButton direction="right" onPress={() => scrollPage(1)} />
        )}
      </div>
    </HomeSection>
  )
}

interface NoteCardProps {
  note: RecentNoteListItem
  tint: string
  label: string
}

function NoteCard({ note, tint, label }: NoteCardProps) {
  return (
    <Link
      variant="unstyled"
      href={`/notes/${note.id}`}
      render={props => (
        <RouterLink
          {...(props as React.ComponentProps<'a'>)}
          to="/notes/$noteId"
          params={{ noteId: note.id }}
        />
      )}
      className="
        flex size-40 flex-col items-stretch gap-0 overflow-hidden rounded-xl
        border bg-bg shadow-xs transition-[border-color,box-shadow,scale]
        duration-150 ease-out
        hover:border-border-control hover:shadow-sm
        sm:w-44
        pressed:scale-[0.98]
      "
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center justify-center bg-linear-to-br',
          tint
        )}
      >
        <span className="
          flex size-8.5 items-center justify-center rounded-lg bg-bg/85
          shadow-xs
        "
        >
          <StickyNoteIcon className="size-4" />
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-3.5">
        <span className="line-clamp-2 text-sm font-medium wrap-break-word">
          {getDisplayTitle(note.title)}
        </span>
        <time
          dateTime={note.viewedAt.toISOString()}
          className="font-mono text-[0.6875rem] text-fg-muted"
        >
          {label}
        </time>
      </div>
    </Link>
  )
}

function NewNoteCard() {
  return (
    <NewNoteButton
      variant="quiet"
      className="
        size-40 snap-start flex-col gap-2 rounded-xl border border-dashed
        border-border-control text-fg-muted
        hover:bg-muted/60 hover:text-fg
        sm:w-44
        pressed:scale-[0.98] pressed:bg-muted
      "
    >
      <PlusIcon className="size-4" />
      New note
    </NewNoteButton>
  )
}

interface ScrollButtonProps {
  direction: 'left' | 'right'
  onPress: () => void
}

function ScrollButton({ direction, onPress }: ScrollButtonProps) {
  const isLeft = direction === 'left'

  return (
    <Button
      variant="outline"
      size="sm"
      isIconOnly
      excludeFromTabOrder
      aria-label={isLeft ? 'Scroll left' : 'Scroll right'}
      onPress={onPress}
      className={cn(
        `
          pointer-events-none absolute top-1/2 z-10 -translate-y-1/2
          rounded-full bg-bg opacity-0 shadow-sm
          transition-[opacity,border-color,background-color]
          group-hover/carousel:pointer-events-auto
          group-hover/carousel:opacity-100
        `,
        isLeft ? '-left-3.5' : '-right-3.5'
      )}
    >
      {isLeft ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </Button>
  )
}

/** Starts from each note's own tint and skips tints already used in the row. */
function assignCoverTints(noteIds: string[]) {
  const used = new Set<number>()

  return noteIds.map((id) => {
    if (used.size === coverTints.length) used.clear()

    let index = hashString(id) % coverTints.length

    while (used.has(index)) index = (index + 1) % coverTints.length
    used.add(index)

    return coverTints[index]
  })
}

function hashString(value: string) {
  let hash = 2_166_136_261

  for (const char of value) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16_777_619)
  }

  return hash >>> 0
}

function useScrollEdges(ref: React.RefObject<HTMLElement | null>) {
  const [edges, setEdges] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  })

  useEffect(() => {
    const scroller = ref.current

    if (!scroller) return

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scroller
      const canScrollLeft = scrollLeft > 1
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1

      setEdges(current =>
        current.canScrollLeft === canScrollLeft
        && current.canScrollRight === canScrollRight
          ? current
          : { canScrollLeft, canScrollRight }
      )
    }

    const observer = new ResizeObserver(update)

    observer.observe(scroller)
    for (const child of scroller.children) observer.observe(child)
    scroller.addEventListener('scroll', update, { passive: true })

    return () => {
      observer.disconnect()
      scroller.removeEventListener('scroll', update)
    }
  }, [ref])

  return edges
}
