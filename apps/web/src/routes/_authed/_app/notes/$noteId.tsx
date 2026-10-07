import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { FileQuestionIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { BackToTop } from '@/components/back-to-top'
import type { NoteEditorHandle } from '@/components/editor/note-editor'
import { NoteEditor } from '@/components/editor/note-editor'
import { NoteToolbar } from '@/components/note-toolbar'
import { NoteWidthToggle } from '@/components/note-width-toggle'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { useDeleteNote, useRecordNoteView } from '@/data/notes/notes.mutation'
import { noteQueryOptions } from '@/data/notes/notes.query'
import {
  getNoteFullWidth,
  persistNoteFullWidth
} from '@/lib/note-width.functions'
import { cn } from '@/lib/utils'
import { getDisplayTitle } from '@/utils/notes'

export const Route = createFileRoute('/_authed/_app/notes/$noteId')({
  loader: async ({ context: { queryClient }, params }) => {
    const note = await queryClient.ensureQueryData(
      noteQueryOptions(params.noteId)
    )

    return { title: note.title, isFullWidth: getNoteFullWidth() }
  },
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
  const { isFullWidth: initialIsFullWidth } = Route.useLoaderData()
  const [isFullWidth, setIsFullWidth] = useState(initialIsFullWidth)
  const [isLocked, setIsLocked] = useState(true)
  const editorRef = useRef<NoteEditorHandle>(null)
  const articleRef = useRef<HTMLElement>(null)
  const { mutate: recordView } = useRecordNoteView()
  const { mutate: deleteNote } = useDeleteNote()

  useEffect(() => {
    recordView(noteId)
  }, [noteId, recordView])

  const changeFullWidth = (next: boolean) => {
    setIsFullWidth(next)
    persistNoteFullWidth(next)
  }

  const handleDelete = async () => {
    await editorRef.current?.flush()
    deleteNote(noteId)
  }

  return (
    <>
      <NoteToolbar
        note={note}
        isLocked={isLocked}
        onLockedChange={locked => editorRef.current?.setLocked(locked)}
        onDelete={() => void handleDelete()}
      />
      <article
        ref={articleRef}
        className={cn(
          `mx-auto flex w-full grow flex-col px-6 pt-4`,
          !isFullWidth && 'max-w-2xl'
        )}
      >
        <NoteEditor
          key={note.id}
          ref={editorRef}
          note={note}
          titleActions={(
            <NoteWidthToggle
              className="ml-auto"
              isFullWidth={isFullWidth}
              onFullWidthChange={changeFullWidth}
            />
          )}
          onLockedChange={setIsLocked}
        />
      </article>
      <BackToTop
        key={note.id}
        targetRef={articleRef}
        focusTarget={() => editorRef.current?.focus()}
      />
    </>
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
