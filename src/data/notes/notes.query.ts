import {
  infiniteQueryOptions,
  queryOptions,
  useSuspenseInfiniteQuery
} from '@tanstack/react-query'

import {
  getNote,
  listNotes,
  listRecentNotes,
  searchNotes
} from '@/utils/notes.functions'

import { noteKeys } from './keys'
import type { NoteListQuery } from './types'

export const defaultNoteListQuery: NoteListQuery = {
  sortBy: 'created-time',
  direction: 'desc',
}

export function noteListQueryOptions(
  query: NoteListQuery = defaultNoteListQuery
) {
  return infiniteQueryOptions({
    queryKey: noteKeys.list(query),
    queryFn: ({ pageParam }) =>
      listNotes({ data: { ...query, cursor: pageParam } }),
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor,
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

export function useNoteList(query?: NoteListQuery) {
  return useSuspenseInfiniteQuery(noteListQueryOptions(query))
}

export function noteSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: noteKeys.search(query),
    queryFn: () => searchNotes({ data: { query } }),
  })
}
