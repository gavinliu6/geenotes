import {
  createFileRoute,
  getRouteApi,
  useNavigate
} from '@tanstack/react-router'
import { PlusIcon, StickyNoteIcon } from 'lucide-react'
import { useEffect } from 'react'

import { NewNoteButton } from '@/components/new-note-button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { useNoteList } from '@/data/notes/notes.query'

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
const notesRoute = getRouteApi('/_authed/_app/notes')

export const Route = createFileRoute('/_authed/_app/notes/')({
  head: () => ({
    meta: [
      {
        title: 'Notes | Geenotes',
      },
    ],
  }),
  component: NotesIndexPage,
})

function NotesIndexPage() {
  const navigate = useNavigate()
  const { sort } = notesRoute.useLoaderData()
  const { data } = useNoteList(sort)
  const firstNoteId = data.pages.at(0)?.items.at(0)?.id

  // Below `md` the index *is* the list, so only desktop jumps to the first note.
  useEffect(() => {
    if (!firstNoteId || !window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return

    void navigate({
      to: '/notes/$noteId',
      params: { noteId: firstNoteId },
      replace: true,
    })
  }, [firstNoteId, navigate])

  if (firstNoteId) return null

  return (
    <Empty className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute top-1/2 left-1/2 -z-10 h-72 w-108
          -translate-1/2 bg-[url('/empty.webp')]
          mask-[radial-gradient(ellipse_70%_56%_at_center,black_44%,transparent_90%)]
          bg-contain bg-center bg-no-repeat opacity-15 saturate-50
          dark:opacity-10 dark:saturate-0
        "
      />
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StickyNoteIcon />
        </EmptyMedia>
        <EmptyTitle>No notes yet</EmptyTitle>
        <EmptyDescription>
          Create your first note to get started. Your notes will show up here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <NewNoteButton variant="primary">
          <PlusIcon data-icon="inline-start" />
          Create note
        </NewNoteButton>
      </EmptyContent>
    </Empty>
  )
}
