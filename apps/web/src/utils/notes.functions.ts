import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { ensureSession } from '@/lib/auth.functions'

import {
  hardDeleteNote,
  insertNote,
  moveNote as moveNoteRecord,
  selectMatchingNotes,
  selectNote,
  selectNoteCount,
  selectNotes,
  selectRecentNotes,
  updateNote,
  upsertNoteView
} from './notes.server'
import {
  createNoteSchema,
  listNotesSchema,
  moveNoteSchema,
  noteIdSchema,
  saveNoteSchema,
  searchNotesSchema
} from './schemas'

export const getNoteCount = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await ensureSession()

  return selectNoteCount(session.user.id)
})

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

export const createNote = createServerFn({ method: 'POST' })
  .validator(createNoteSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    return insertNote(session.user.id, data.folderId)
  })

export const moveNote = createServerFn({ method: 'POST' })
  .validator(moveNoteSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const note = await moveNoteRecord(session.user.id, data.noteId, data.folderId)

    if (!note) throw notFound()

    return note
  })

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
