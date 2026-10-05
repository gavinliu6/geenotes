import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toastManager } from '@/components/ui/toast'
import { updateNoteShare } from '@/utils/share.functions'

import { noteQueryOptions } from './notes.query'

export function useUpdateNoteShare(noteId: string) {
  const queryClient = useQueryClient()
  const { queryKey } = noteQueryOptions(noteId)

  return useMutation({
    mutationFn: (isShared: boolean) =>
      updateNoteShare({ data: { noteId, isShared } }),
    onMutate: (isShared) => {
      void queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, note =>
        note && { ...note, sharedAt: isShared ? new Date() : null }
      )

      return { previous }
    },
    onSuccess: ({ sharedAt }) => {
      queryClient.setQueryData(queryKey, note => note && { ...note, sharedAt })
    },
    onError: (_, isShared, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toastManager.add({
        type: 'error',
        description: isShared ? 'Failed to share note' : 'Failed to stop sharing',
      })
    },
  })
}
