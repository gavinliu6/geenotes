import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { ensureSession } from '@/lib/auth.functions'

import {
  hardDeleteNote,
  insertNote,
  selectMatchingNotes,
  selectNote,
  selectNotes,
  selectRecentNotes,
  updateNote,
  upsertNoteView
} from './notes.server'
import {
  listNotesSchema,
  noteIdSchema,
  saveNoteSchema,
  searchNotesSchema
} from './schemas'

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

export const searchNotes = createServerFn({ method: 'GET' })
  .validator(searchNotesSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    return selectMatchingNotes(session.user.id, data.query)
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

export const saveNote = createServerFn({ method: 'POST' })
  .validator(saveNoteSchema)
  .handler(async ({ data: { noteId, ...changes } }) => {
    const session = await ensureSession()
    const note = await updateNote(session.user.id, noteId, changes)

    if (!note) throw notFound()

    return note
  })

export const deleteNote = createServerFn({ method: 'POST' })
  .validator(noteIdSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const note = await hardDeleteNote(session.user.id, data.noteId)

    if (!note) throw notFound()
  })

export const recordNoteView = createServerFn({ method: 'POST' })
  .validator(noteIdSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    await upsertNoteView(session.user.id, data.noteId)
  })
