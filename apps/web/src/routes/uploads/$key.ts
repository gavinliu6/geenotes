import { createFileRoute } from '@tanstack/react-router'

import { auth } from '@/lib/auth'
import { selectSharedUploadOwner } from '@/utils/share.server'
import { getUpload } from '@/utils/uploads.server'

export const Route = createFileRoute('/uploads/$key')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        const ownerId
          = session?.user.id ?? (await selectSharedUploadOwner(params.key))

        if (!ownerId) return new Response('Unauthorized', { status: 401 })

        const object = await getUpload(ownerId, params.key, request.headers)

        if (!object) return new Response('Not found', { status: 404 })

        const headers = new Headers()

        object.writeHttpMetadata(headers)
        headers.set('ETag', object.httpEtag)
        headers.set('Cache-Control', 'private, max-age=31536000, immutable')
        headers.set('X-Content-Type-Options', 'nosniff')

        return 'body' in object
          ? new Response(object.body, { headers })
          : new Response(null, { status: 304, headers })
      },
    },
  },
})
