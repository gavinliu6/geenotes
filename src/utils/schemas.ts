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

export type NoteSortBy = z.infer<typeof noteSortBySchema>
export type SortDirection = z.infer<typeof sortDirectionSchema>
export type ListNotesParams = z.output<typeof listNotesSchema>

export type Note = typeof note.$inferSelect
export type NoteListItem = Pick<Note, 'id' | 'title' | 'createdAt' | 'updatedAt'>
export type RecentNoteListItem = NoteListItem & { viewedAt: Date }
