import { z } from 'zod'

import type { note } from '@/db/schema'

export const noteSortBySchema = z.enum(['created-time', 'updated-time', 'title'])
export const sortDirectionSchema = z.enum(['asc', 'desc'])

export const listNotesSchema = z.object({
  sortBy: noteSortBySchema.default('updated-time'),
  direction: sortDirectionSchema.default('desc'),
  cursor: z.string().nullish(),
})

export const noteIdSchema = z.object({
  noteId: z.string().min(1),
})

export const searchNotesSchema = z.object({
  query: z.string().trim().min(1).max(100),
})

export const RECENT_NOTES_LIMIT = 6

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

export const updateNoteShareSchema = noteIdSchema.extend({
  isShared: z.boolean(),
})

export const USER_NAME_MAX_LENGTH = 50
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export const userNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(
    USER_NAME_MAX_LENGTH,
    `Name must be ${USER_NAME_MAX_LENGTH} characters or fewer`
  )

export const PASSWORD_COMPROMISED_ERROR
  = 'This password has shown up in data breaches. Choose a different one.'

/** Apple Account rules: https://support.apple.com/en-us/102614 */
export const passwordRequirements = [
  {
    label: `${PASSWORD_MIN_LENGTH} or more characters`,
    test: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: 'Upper and lowercase letters',
    test: (password: string) =>
      /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password),
  },
  {
    label: 'At least one number',
    test: (password: string) => /\p{Nd}/u.test(password),
  },
]

export const newPasswordSchema = z
  .string()
  .refine(
    password => passwordRequirements.every(({ test }) => test(password)),
    'Password doesn\'t meet the requirements'
  )
  .refine(
    password => !/(.)\1\1/u.test(password),
    'Don\'t use the same character three times in a row'
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`
  )

export const setPasswordSchema = z.object({
  newPassword: newPasswordSchema,
})

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
export type SharedNote = Pick<Note, 'id' | 'title' | 'markdown' | 'updatedAt'>
