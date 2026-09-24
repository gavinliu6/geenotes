import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { toastManager } from '@/components/ui/toast'
import { createNote, recordNoteView } from '@/utils/notes.functions'

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
        ])
      }

      return queryClient.invalidateQueries({ queryKey: noteKeys.recent() })
    },
  })
}
