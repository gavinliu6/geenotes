import { createServerFn } from '@tanstack/react-start'

import { ensureSession } from '@/lib/auth.functions'

import { imageFileSchema } from './schemas'
import { putUpload } from './uploads.server'

export const uploadImage = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('Expected form data')

    return imageFileSchema.parse(data.get('file'))
  })
  .handler(async ({ data: file }) => {
    const session = await ensureSession()
    const key = await putUpload(session.user.id, file)

    return { url: `/uploads/${key}` }
  })
