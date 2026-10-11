import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { discardSaveQueue } from '@/components/editor/save-status'
import { toastManager } from '@/components/ui/toast'
import { folderKeys } from '@/data/folders/keys'
import { folderErrorMessage } from '@/utils/folders'
import {
  createNote,
  deleteNote,
  moveNote,
  recordNoteView,
  saveNote
} from '@/utils/notes.functions'
import type { NoteChanges, NoteListScope } from '@/utils/schemas'
import { RECENT_NOTES_LIMIT } from '@/utils/schemas'

import {
  markNoteListsStale,
  patchCachedNoteFolder,
  removeCachedNotes,
  updateNoteListItems
} from './cache'
import { noteKeys } from './keys'
import { noteQueryOptions, recentNoteListQueryOptions } from './notes.query'
import {
  allNotesScope,
  noteListSearch,
  sameNoteListScope,
  scopeFromFolder
} from './scope'

export function useCreateNote(scope: NoteListScope = allNotesScope) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => createNote({
      data: scope.kind === 'folder' ? { folderId: scope.folderId } : {},
    }),
    onSuccess: (note) => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: noteKeys.count() })
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() })

      return navigate({
        to: '/notes/$noteId',
        params: { noteId: note.id },
        search: noteListSearch(scope),
      })
    },
    onError: (error) => {
      toastManager.add({
        type: 'error',
        description: folderErrorMessage(error, 'Failed to create note'),
      })
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
        const { id, title, folderId, createdAt, updatedAt } = note
        const item = { id, title, folderId, createdAt, updatedAt, viewedAt: new Date() }

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

export function useMoveNote(noteId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()

  return useMutation({
    scope: { id: `move-note:${noteId}` },
    mutationFn: (input: { noteId: string, folderId: string, scope: NoteListScope }) =>
      moveNote({ data: { noteId: input.noteId, folderId: input.folderId } }),
    onSuccess: async (moved, input) => {
      // The observer swaps in the latest hook callbacks while a move is in
      // flight, so the closed-over noteId may already belong to another note.
      const movedNoteId = moved.id
      const previous = queryClient.getQueryData(noteQueryOptions(movedNoteId).queryKey)
      const unchanged = previous?.folderId === moved.folderId

      await patchCachedNoteFolder(queryClient, movedNoteId, moved.folderId)

      if (!unchanged) {
        void queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
        void queryClient.invalidateQueries({ queryKey: folderKeys.list() })
      }

      const noteMatch = router.state.matches.find(match =>
        match.routeId === '/_authed/_app/notes/$noteId'
      )
      const notesMatch = router.state.matches.find(match =>
        match.routeId === '/_authed/_app/notes'
      )
      const currentNoteId = noteMatch?.params.noteId
      const folder = notesMatch?.search.folder
      const stillThere = currentNoteId === movedNoteId
        && sameNoteListScope(scopeFromFolder(folder), input.scope)

      if (!stillThere || unchanged || input.scope.kind !== 'folder' || !moved.folderId) {
        return
      }

      return navigate({
        to: '/notes/$noteId',
        params: { noteId: movedNoteId },
        search: { folder: moved.folderId },
      })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()

  return useMutation({
    mutationFn: (noteId: string) => deleteNote({ data: { noteId } }),
    onSuccess: async (_, noteId) => {
      discardSaveQueue(noteId)
      removeCachedNotes(queryClient, [noteId])
      markNoteListsStale(queryClient)
      void queryClient.invalidateQueries({ queryKey: noteKeys.count() })
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() })

      const notesMatch = router.state.matches.find(match =>
        match.routeId === '/_authed/_app/notes'
      )
      const folder = notesMatch?.search.folder

      await navigate({
        to: '/notes',
        search: folder ? { folder } : {},
        replace: true,
      })
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
