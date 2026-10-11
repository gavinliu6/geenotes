import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createFileRoute, Navigate, redirect } from '@tanstack/react-router'
import { PlusIcon, StickyNoteIcon } from 'lucide-react'

import { NewNoteButton } from '@/components/new-note-button'
import { useNoteListSort } from '@/components/note-list'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { folderListQueryOptions } from '@/data/folders/folders.query'
import { loadNoteList, noteListQueryOptions } from '@/data/notes/notes.query'
import { scopeFromFolder } from '@/data/notes/scope'
import { getNoteListSort } from '@/lib/note-list.functions'

export const Route = createFileRoute('/_authed/_app/notes/')({
  loaderDeps: ({ search }) => ({ folder: search.folder }),
  loader: async ({ context: { queryClient }, deps }) => {
    const scope = scopeFromFolder(deps.folder)
    const notes = await loadNoteList(
      queryClient,
      { ...getNoteListSort(), scope }
    )
    const page = notes.pages.at(0)

    if (page?.status !== 'ok') return

    const firstNoteId = page.items[0]?.id

    if (firstNoteId) {
      throw redirect({
        to: '/notes/$noteId',
        params: { noteId: firstNoteId },
        search: deps.folder ? { folder: deps.folder } : {},
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
  const { folder } = Route.useSearch()
  const scope = scopeFromFolder(folder)
  const { sort } = useNoteListSort('NoteList')
  const { data: list } = useInfiniteQuery(noteListQueryOptions({ ...sort, scope }))
  const { data: folders } = useQuery(folderListQueryOptions())
  const firstNoteId = list?.pages[0]?.status === 'ok'
    ? list.pages[0].items[0]?.id
    : undefined

  if (firstNoteId) {
    return (
      <Navigate
        to="/notes/$noteId"
        params={{ noteId: firstNoteId }}
        search={folder ? { folder } : {}}
        replace
      />
    )
  }
  const folderName = scope.kind === 'folder'
    ? folders?.find(item => item.id === scope.folderId)?.name
    : undefined

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StickyNoteIcon />
        </EmptyMedia>
        <EmptyTitle>
          {scope.kind === 'folder'
            ? folderName
              ? `No notes in ${folderName}`
              : 'No notes in this folder'
            : 'No notes yet'}
        </EmptyTitle>
        <EmptyDescription>
          {scope.kind === 'folder'
            ? 'Notes you create here are filed in this folder.'
            : 'Create your first note to get started. Your notes will show up here.'}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <NewNoteButton scope={scope} variant="inverse">
          <PlusIcon data-icon="inline-start" />
          New note
        </NewNoteButton>
      </EmptyContent>
    </Empty>
  )
}
