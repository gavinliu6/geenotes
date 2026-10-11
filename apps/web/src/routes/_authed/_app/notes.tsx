import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet } from '@tanstack/react-router'

import { FolderUnavailable } from '@/components/folder-unavailable'
import { NoteList, NoteListSortProvider, useNoteListSort } from '@/components/note-list'
import { noteListQueryOptions } from '@/data/notes/notes.query'
import { scopeFromFolder } from '@/data/notes/scope'
import { useIsMobile } from '@/hooks/use-mobile'
import { getNoteListSort } from '@/lib/note-list.functions'
import { notesSearchSchema } from '@/utils/schemas'

export const Route = createFileRoute('/_authed/_app/notes')({
  validateSearch: notesSearchSchema,
  loaderDeps: ({ search }) => ({ folder: search.folder }),
  loader: async ({ context: { queryClient }, deps }) => {
    const sort = getNoteListSort()
    const scope = scopeFromFolder(deps.folder)
    await queryClient.ensureInfiniteQueryData(
      noteListQueryOptions({ ...sort, scope })
    )

    return { sort }
  },
  component: NotesLayout,
})

function NotesLayout() {
  const isMobile = useIsMobile()

  return (
    <NoteListSortProvider>
      <NotesShell isMobile={isMobile} />
    </NoteListSortProvider>
  )
}

function NotesShell({ isMobile }: { isMobile: boolean }) {
  const { sort } = useNoteListSort('NoteList')
  const { folder } = Route.useSearch()
  const scope = scopeFromFolder(folder)
  const { data } = useInfiniteQuery(noteListQueryOptions({ ...sort, scope }))
  const unavailable = data?.pages[0]?.status === 'unavailable'

  if (unavailable) return <FolderUnavailable />

  return (
    <div className="
      flex flex-1
      md:min-h-0
    "
    >
      {!isMobile && (
        <NoteList className="
          w-72 shrink-0 border-r
          max-md:hidden
        "
        />
      )}
      <div className="
        @container flex min-w-0 flex-1 flex-col
        md:overflow-y-auto
      "
      >
        <Outlet />
      </div>
    </div>
  )
}
