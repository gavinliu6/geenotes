import type { QueryClient } from '@tanstack/react-query'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import {
  getNote,
  getNoteCount,
  listNotes,
  listRecentNotes,
  searchNotes
} from '@/utils/notes.functions'

import { noteKeys } from './keys'
import { allNotesScope } from './scope'
import type { NoteListQuery, NoteListSort } from './types'

export const defaultNoteListSort: NoteListSort = {
  sortBy: 'updated-time',
  direction: 'desc',
}

export const defaultNoteListQuery: NoteListQuery = {
  ...defaultNoteListSort,
  scope: allNotesScope,
}

export function noteListQueryOptions(query: NoteListQuery = defaultNoteListQuery) {
  return infiniteQueryOptions({
    queryKey: noteKeys.list(query),
    queryFn: ({ pageParam }) =>
      listNotes({ data: { ...query, cursor: pageParam } }),
    initialPageParam: null as string | null,
    getNextPageParam: lastPage =>
      lastPage.status === 'ok' ? lastPage.nextCursor : null,
  })
}

/**
 * Reads the note list, refetching first when the cached pages were invalidated.
 * `ensureInfiniteQueryData` resolves those pages without waiting.
 */
export function loadNoteList(queryClient: QueryClient, query: NoteListQuery) {
  const options = noteListQueryOptions(query)
  const state = queryClient.getQueryState(options.queryKey)
  const fresh = state?.data !== undefined && !state.isInvalidated

  return queryClient.infiniteQuery({
    ...options,
    staleTime: fresh ? 'static' : 0,
  })
}

export function noteCountQueryOptions() {
  return queryOptions({
    queryKey: noteKeys.count(),
    queryFn: () => getNoteCount(),
  })
}

export function noteQueryOptions(noteId: string) {
  return queryOptions({
    queryKey: noteKeys.detail(noteId),
    queryFn: () => getNote({ data: { noteId } }),
    retry: false,
  })
}

export function recentNoteListQueryOptions() {
  return queryOptions({
    queryKey: noteKeys.recent(),
    queryFn: () => listRecentNotes(),
  })
}

export function noteSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: noteKeys.search(query),
    queryFn: () => searchNotes({ data: { query } }),
  })
}
