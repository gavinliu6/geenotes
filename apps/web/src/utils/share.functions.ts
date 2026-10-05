import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { ensureSession } from '@/lib/auth.functions'

import { noteIdSchema, updateNoteShareSchema } from './schemas'
import { selectSharedNote, setNoteShared } from './share.server'

export const updateNoteShare = createServerFn({ method: 'POST' })
  .validator(updateNoteShareSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const share = await setNoteShared(session.user.id, data.noteId, data.isShared)

    if (!share) throw notFound()

    return share
  })

export const getSharedNote = createServerFn({ method: 'GET' })
  .validator(noteIdSchema)
  .handler(async ({ data }) => {
    const note = await selectSharedNote(data.noteId)

    if (!note) throw notFound()

    return note
  })
