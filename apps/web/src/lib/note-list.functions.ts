import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { z } from 'zod'

import { defaultNoteListSort } from '@/data/notes/notes.query'
import type { NoteListSort } from '@/data/notes/types'
import { noteSortBySchema, sortDirectionSchema } from '@/utils/schemas'

const NOTE_SORT_COOKIE_NAME = 'note_sort'
// 400 days: the longest lifetime browsers still honour.
const NOTE_SORT_COOKIE_MAX_AGE = 60 * 60 * 24 * 400

const noteSortCookieSchema = z.tuple([noteSortBySchema, sortDirectionSchema])

export const getNoteListSort = createIsomorphicFn()
  .server(() => parseNoteListSort(getCookie(NOTE_SORT_COOKIE_NAME)))
  .client(() => {
    const entry = document.cookie
      .split('; ')
      .find(cookie => cookie.startsWith(`${NOTE_SORT_COOKIE_NAME}=`))

    return parseNoteListSort(entry?.slice(NOTE_SORT_COOKIE_NAME.length + 1))
  })

/** Persists the note list sort for `getNoteListSort` to pick up. */
export function persistNoteListSort({ sortBy, direction }: NoteListSort) {
  document.cookie = `${NOTE_SORT_COOKIE_NAME}=${sortBy}:${direction}; path=/; max-age=${NOTE_SORT_COOKIE_MAX_AGE}; SameSite=Lax`
}

function parseNoteListSort(value?: string): NoteListSort {
  const result = noteSortCookieSchema.safeParse(value?.split(':'))

  if (!result.success) return defaultNoteListSort

  const [sortBy, direction] = result.data

  return { sortBy, direction }
}
