import { createFileRoute, Outlet } from '@tanstack/react-router'

import { NoteList, NoteListSortProvider } from '@/components/note-list'
import { noteListQueryOptions } from '@/data/notes/notes.query'
import { useIsMobile } from '@/hooks/use-mobile'
import { getNoteListSort } from '@/lib/note-list.functions'

export const Route = createFileRoute('/_authed/_app/notes')({
  loader: async ({ context: { queryClient } }) => {
    const sort = getNoteListSort()

    await queryClient.ensureInfiniteQueryData(noteListQueryOptions(sort))

    return { sort }
  },
  component: NotesLayout,
})

function NotesLayout() {
  const isMobile = useIsMobile()

  return (
    <NoteListSortProvider>
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
    </NoteListSortProvider>
  )
}
