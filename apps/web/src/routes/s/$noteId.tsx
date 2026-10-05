import { createFileRoute, Link, useHydrated } from '@tanstack/react-router'
import { useState } from 'react'

import { MarkdownViewer } from '@/components/editor/markdown-viewer'
import { Logo } from '@/components/icons'
import { Loader } from '@/components/ui/loader'
import { getTimeZone } from '@/lib/timezone.functions'
import { formatNoteDate, getDisplayTitle } from '@/utils/notes'
import { getSharedNote } from '@/utils/share.functions'

export const Route = createFileRoute('/s/$noteId')({
  loader: ({ params }) => getSharedNote({ data: { noteId: params.noteId } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${getDisplayTitle(loaderData?.title)} | Geenotes`,
      },
      {
        name: 'robots',
        content: 'noindex',
      },
    ],
  }),
  component: SharedNotePage,
})

function SharedNotePage() {
  const note = Route.useLoaderData()
  const [isReady, setIsReady] = useState(false)
  const timeZone = useHydrated() ? getTimeZone() : null

  return (
    <>
      <div className={isReady ? undefined : 'invisible h-0 overflow-hidden'}>
        <main>
          <article className="
            mx-auto w-full max-w-2xl px-6 pt-12
            md:pt-20
          "
          >
            <h1 className="
              border-b pb-3 text-[2rem]/10 tracking-tight wrap-break-word
            "
            >
              {getDisplayTitle(note.title)}
            </h1>
            <p className="mt-3 text-sm text-fg-muted">
              Updated
              {' '}
              <time dateTime={note.updatedAt.toISOString()}>
                {timeZone && formatNoteDate(note.updatedAt, timeZone)}
              </time>
            </p>
            <MarkdownViewer
              markdown={note.markdown}
              className="mt-6"
              onReady={() => setIsReady(true)}
            />
          </article>
        </main>
        <footer className="mx-auto w-full max-w-2xl px-6 pt-2 pb-16">
          <Link
            to="/"
            className="
              group inline-flex items-center gap-1 rounded-sm text-xs
              text-fg-muted focus-reset transition-colors
              hover:text-fg
              focus-visible:focus-ring
            "
          >
            <Logo
              size={12}
              className="
                transition-colors
                group-hover:text-yellow-500
                dark:group-hover:text-yellow-400
              "
            />
            Made with Geenotes
          </Link>
        </footer>
      </div>
      {!isReady && (
        <div className="flex min-h-svh">
          <Loader aria-label="Loading note" className="m-auto" />
        </div>
      )}
    </>
  )
}
