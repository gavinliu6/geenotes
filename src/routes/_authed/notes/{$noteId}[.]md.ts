import { createFileRoute } from '@tanstack/react-router'

import { auth } from '@/lib/auth'
import { toNoteMarkdown } from '@/utils/notes'
import { selectNote } from '@/utils/notes.server'

export const Route = createFileRoute('/_authed/notes/{$noteId}.md')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers })

        if (!session) return new Response('Unauthorized', { status: 401 })

        const note = await selectNote(session.user.id, params.noteId)

        if (!note) return new Response('Not found', { status: 404 })

        return new Response(toNoteMarkdown(note), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'private, no-store',
          },
        })
      },
    },
  },
})
