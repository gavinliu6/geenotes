import { z } from 'zod'

import type { note } from '@/db/schema'

export const noteSortBySchema = z.enum(['created-time', 'updated-time', 'title'])
export const sortDirectionSchema = z.enum(['asc', 'desc'])

export const listNotesSchema = z.object({
  sortBy: noteSortBySchema.default('created-time'),
  direction: sortDirectionSchema.default('desc'),
  cursor: z.string().nullish(),
})

export const noteIdSchema = z.object({
  noteId: z.string().min(1),
})

export const searchNotesSchema = z.object({
  query: z.string().trim().min(1).max(100),
})

export const NOTE_TITLE_MAX_LENGTH = 500

export const saveNoteSchema = noteIdSchema
  .extend({
    title: z.string().max(NOTE_TITLE_MAX_LENGTH).optional(),
    markdown: z.string().max(500_000).optional(),
  })
  .refine(
    data => data.title !== undefined || data.markdown !== undefined,
    'Nothing to save'
  )

export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024

export const imageFileSchema = z
  .file()
  .max(IMAGE_UPLOAD_MAX_BYTES)
  .mime(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'])

export type NoteSortBy = z.infer<typeof noteSortBySchema>
export type SortDirection = z.infer<typeof sortDirectionSchema>
export type ListNotesParams = z.output<typeof listNotesSchema>
export type SaveNoteInput = z.input<typeof saveNoteSchema>
export type NoteChanges = Omit<SaveNoteInput, 'noteId'>

export type Note = typeof note.$inferSelect
export type NoteListItem = Pick<Note, 'id' | 'title' | 'createdAt' | 'updatedAt'>
export type RecentNoteListItem = NoteListItem & { viewedAt: Date }
