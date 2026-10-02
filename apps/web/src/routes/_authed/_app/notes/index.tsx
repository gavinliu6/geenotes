import { createFileRoute, redirect } from '@tanstack/react-router'
import { PlusIcon, StickyNoteIcon } from 'lucide-react'

import { NewNoteButton } from '@/components/new-note-button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { noteListQueryOptions } from '@/data/notes/notes.query'
import { getNoteListSort } from '@/lib/note-list.functions'

export const Route = createFileRoute('/_authed/_app/notes/')({
  loader: async ({ context: { queryClient } }) => {
    const notes = await queryClient.ensureInfiniteQueryData(
      noteListQueryOptions(getNoteListSort())
    )
    const firstNoteId = notes.pages.at(0)?.items.at(0)?.id

    if (firstNoteId) {
      throw redirect({
        to: '/notes/$noteId',
        params: {
          noteId: firstNoteId,
        },
        replace: true,
      })
    }
  },
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
  return (
    <Empty>
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
        <NewNoteButton variant="inverse">
          <PlusIcon data-icon="inline-start" />
          New note
        </NewNoteButton>
      </EmptyContent>
    </Empty>
  )
}
