import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { FileQuestionIcon } from 'lucide-react'
import { useEffect } from 'react'

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { useRecordNoteView } from '@/data/notes/notes.mutation'
import { noteQueryOptions } from '@/data/notes/notes.query'
import { getDisplayTitle } from '@/utils/notes'

export const Route = createFileRoute('/_authed/_app/notes/$noteId')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(noteQueryOptions(params.noteId)),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${getDisplayTitle(loaderData?.title)} | Geenotes`,
      },
    ],
  }),
  notFoundComponent: NoteNotFound,
  component: NotePage,
})

function NotePage() {
  const { noteId } = Route.useParams()
  const { data: note } = useSuspenseQuery(noteQueryOptions(noteId))
  const { mutate: recordView } = useRecordNoteView()

  useEffect(() => {
    recordView(noteId)
  }, [noteId, recordView])

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="font-serif text-3xl">{getDisplayTitle(note.title)}</h1>
      {note.markdown.trim()
        ? (
            <pre className="mt-8 font-sans text-sm/relaxed whitespace-pre-wrap">
              {note.markdown}
            </pre>
          )
        : (
            <p className="mt-8 text-sm text-fg-muted">This note is empty.</p>
          )}
    </article>
  )
}

function NoteNotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionIcon />
        </EmptyMedia>
        <EmptyTitle>Note not found</EmptyTitle>
        <EmptyDescription>
          This note doesn't exist or has been deleted.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
