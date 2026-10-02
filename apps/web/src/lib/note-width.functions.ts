import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

const NOTE_FULL_WIDTH_COOKIE_NAME = 'note_full_width'
// 400 days: the longest lifetime browsers still honour.
const NOTE_FULL_WIDTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 400

export const getNoteFullWidth = createIsomorphicFn()
  .server(() => getCookie(NOTE_FULL_WIDTH_COOKIE_NAME) === '1')
  .client(() =>
    document.cookie
      .split('; ')
      .includes(`${NOTE_FULL_WIDTH_COOKIE_NAME}=1`)
  )

/** Persists the note width for `getNoteFullWidth` to pick up. */
export function persistNoteFullWidth(isFullWidth: boolean) {
  const maxAge = isFullWidth ? NOTE_FULL_WIDTH_COOKIE_MAX_AGE : 0

  document.cookie = `${NOTE_FULL_WIDTH_COOKIE_NAME}=1; path=/; max-age=${maxAge}; SameSite=Lax`
}
