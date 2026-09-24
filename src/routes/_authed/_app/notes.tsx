import {
  createFileRoute,
  Link as RouterLink,
  Outlet,
  useParams
} from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import type * as React from 'react'

import { NoteList } from '@/components/note-list'
import { LinkButton } from '@/components/ui/button'
import { noteListQueryOptions } from '@/data/notes/notes.query'
import { getNoteListSort } from '@/lib/note-list.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authed/_app/notes')({
  loader: async ({ context: { queryClient } }) => {
    const sort = getNoteListSort()

    await queryClient.ensureInfiniteQueryData(noteListQueryOptions(sort))

    return { sort }
  },
  component: NotesLayout,
})

function NotesLayout() {
  const { noteId } = useParams({ strict: false })

  return (
    <div className="
      flex flex-1
      max-md:flex-col
      md:min-h-0
    "
    >
      <NoteList
        className={cn(
          'md:w-72 md:shrink-0 md:border-r',
          noteId && 'max-md:hidden'
        )}
      />
      <div className="
        flex min-w-0 flex-1 flex-col
        md:overflow-y-auto
      "
      >
        {noteId && (
          <div className="
            px-2 py-1
            md:hidden
          "
          >
            <LinkButton
              variant="quiet"
              size="sm"
              href="/notes"
              render={props => (
                <RouterLink {...(props as React.ComponentProps<'a'>)} to="/notes" />
              )}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              All notes
            </LinkButton>
          </div>
        )}
        <Outlet />
      </div>
    </div>
  )
}
