import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { ensureSession } from '@/lib/auth.functions'

import {
  insertNote,
  selectNote,
  selectNotes,
  selectRecentNotes,
  upsertNoteView
} from './notes.server'
import { listNotesSchema, noteIdSchema } from './schemas'

export const listNotes = createServerFn({ method: 'GET' })
  .validator(listNotesSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    return selectNotes(session.user.id, data)
  })

export const getNote = createServerFn({ method: 'GET' })
  .validator(noteIdSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const note = await selectNote(session.user.id, data.noteId)

    if (!note) throw notFound()

    return note
  })

export const listRecentNotes = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await ensureSession()

    return selectRecentNotes(session.user.id)
  }
)

export const createNote = createServerFn({ method: 'POST' }).handler(
  async () => {
    const session = await ensureSession()

    return insertNote(session.user.id)
  }
)

export const recordNoteView = createServerFn({ method: 'POST' })
  .validator(noteIdSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    await upsertNoteView(session.user.id, data.noteId)
  })
