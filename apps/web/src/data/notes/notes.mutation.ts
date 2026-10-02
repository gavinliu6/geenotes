import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { discardSaveQueue } from '@/components/editor/save-status'
import { toastManager } from '@/components/ui/toast'
import {
  createNote,
  deleteNote,
  recordNoteView,
  saveNote
} from '@/utils/notes.functions'
import type { NoteChanges, NoteListItem } from '@/utils/schemas'
import { RECENT_NOTES_LIMIT } from '@/utils/schemas'

import { noteKeys } from './keys'
import { noteQueryOptions, recentNoteListQueryOptions } from './notes.query'

export function useCreateNote() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => createNote(),
    onSuccess: (note) => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.lists() })

      return navigate({ to: '/notes/$noteId', params: { noteId: note.id } })
    },
    onError: () => {
      toastManager.add({ type: 'error', description: 'Failed to create note' })
    },
  })
}

export function useRecordNoteView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noteId: string) => recordNoteView({ data: { noteId } }),
    onSuccess: (_, noteId) => {
      const note = queryClient.getQueryData(noteQueryOptions(noteId).queryKey)

      if (note) {
        const { id, title, createdAt, updatedAt } = note
        const item = { id, title, createdAt, updatedAt, viewedAt: new Date() }

        queryClient.setQueryData(recentNoteListQueryOptions().queryKey, recent => [
          item,
          ...(recent ?? []).filter(entry => entry.id !== id),
        ].slice(0, RECENT_NOTES_LIMIT))
      }

      return queryClient.invalidateQueries({ queryKey: noteKeys.recent() })
    },
  })
}

export function useSaveNote(noteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    scope: { id: `save-note:${noteId}` },
    mutationFn: (changes: NoteChanges) =>
      saveNote({ data: { noteId, ...changes } }),
    onMutate: (changes) => {
      applyNoteChanges(queryClient, noteId, changes)
    },
    onSuccess: ({ updatedAt }, changes) => {
      const { queryKey } = noteQueryOptions(noteId)

      void queryClient.cancelQueries({ queryKey })
      queryClient.setQueryData(queryKey, note =>
        note && { ...note, ...changes, updatedAt }
      )
      markNoteListsStale(queryClient)
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (noteId: string) => deleteNote({ data: { noteId } }),
    onSuccess: async (_, noteId) => {
      discardSaveQueue(noteId)
      updateNoteListItems(queryClient, items =>
        items.filter(item => item.id !== noteId)
      )
      markNoteListsStale(queryClient)
      await navigate({ to: '/notes', replace: true })
      queryClient.removeQueries({ queryKey: noteKeys.detail(noteId) })
    },
    onError: () => {
      toastManager.add({ type: 'error', description: 'Failed to delete note' })
    },
  })
}

/** Writes unsaved changes into every cached copy of the note, ahead of the server. */
export function applyNoteChanges(
  queryClient: QueryClient,
  noteId: string,
  changes: NoteChanges
) {
  const { queryKey } = noteQueryOptions(noteId)

  void queryClient.cancelQueries({ queryKey })
  queryClient.setQueryData(queryKey, note => note && { ...note, ...changes })

  const { title } = changes

  if (title === undefined) return

  updateNoteListItems(queryClient, items =>
    items.map(item => (item.id === noteId ? { ...item, title } : item))
  )
}

function updateNoteListItems(
  queryClient: QueryClient,
  update: <T extends NoteListItem>(items: T[]) => T[]
) {
  queryClient.setQueriesData<
    InfiniteData<{ items: NoteListItem[], nextCursor: string | null }>
  >({ queryKey: noteKeys.lists() }, data =>
    data && {
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

function markNoteListsStale(queryClient: QueryClient) {
  for (const queryKey of [noteKeys.lists(), noteKeys.recent(), noteKeys.searches()]) {
    void queryClient.invalidateQueries({ queryKey, refetchType: 'none' })
  }
}
