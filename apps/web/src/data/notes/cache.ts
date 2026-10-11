import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import type { NoteListItem } from '@/utils/schemas'

import { noteKeys } from './keys'
import { noteQueryOptions, recentNoteListQueryOptions } from './notes.query'

interface NoteListPage {
  items: NoteListItem[]
  nextCursor: string | null
}

export function updateNoteListItems(
  queryClient: QueryClient,
  update: <T extends NoteListItem>(items: T[]) => T[]
) {
  queryClient.setQueriesData<InfiniteData<NoteListPage>>(
    { queryKey: noteKeys.lists() },
    data => data && {
      ...data,
      pages: data.pages.map(page => ({ ...page, items: update(page.items) })),
    }
  )
  queryClient.setQueryData(recentNoteListQueryOptions().queryKey, recent =>
    recent && update(recent)
  )
  queryClient.setQueriesData<NoteListItem[]>(
    { queryKey: noteKeys.searches() },
    results => results && update(results)
  )
}

export function markNoteListsStale(queryClient: QueryClient) {
  for (const queryKey of [noteKeys.lists(), noteKeys.recent(), noteKeys.searches()]) {
    void queryClient.invalidateQueries({ queryKey, refetchType: 'none' })
  }
}

/** Changes only the note's folder. Title and markdown stay as cached, including unsaved edits. */
export async function patchCachedNoteFolder(
  queryClient: QueryClient,
  noteId: string,
  folderId: string | null
) {
  // A detail fetch started before this move would otherwise resolve afterwards
  // and write the previous folderId back over this patch.
  await queryClient.cancelQueries({ queryKey: noteQueryOptions(noteId).queryKey })
  queryClient.setQueryData(noteQueryOptions(noteId).queryKey, note =>
    note && { ...note, folderId }
  )
  updateNoteListItems(queryClient, items =>
    items.map(item => (item.id === noteId ? { ...item, folderId } : item))
  )
}

export async function clearCachedNoteFolder(queryClient: QueryClient, folderId: string) {
  await queryClient.cancelQueries({
    queryKey: noteKeys.details(),
    predicate: (query) => {
      const note = query.state.data as { folderId: string | null } | undefined

      if (note) return note.folderId === folderId

      return query.state.fetchStatus !== 'idle'
    },
  })
  queryClient.setQueriesData(
    { queryKey: noteKeys.details() },
    (note: { folderId: string | null } | undefined) =>
      note && note.folderId === folderId ? { ...note, folderId: null } : note
  )
  updateNoteListItems(queryClient, items =>
    items.map(item => (item.folderId === folderId ? { ...item, folderId: null } : item))
  )
}

export function removeCachedNotes(queryClient: QueryClient, noteIds: string[]) {
  const removed = new Set(noteIds)

  for (const noteId of noteIds) {
    void queryClient.cancelQueries({ queryKey: noteKeys.detail(noteId) })
    queryClient.removeQueries({ queryKey: noteKeys.detail(noteId) })
  }

  updateNoteListItems(queryClient, items => items.filter(item => !removed.has(item.id)))
}
