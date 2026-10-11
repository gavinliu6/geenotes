import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { discardSaveQueue } from '@/components/editor/save-status'
import {
  clearCachedNoteFolder,
  removeCachedNotes
} from '@/data/notes/cache'
import { noteKeys } from '@/data/notes/keys'
import {
  createFolder,
  deleteFolder,
  renameFolder
} from '@/utils/folders.functions'
import type { FolderListItem } from '@/utils/schemas'

import { folderListQueryOptions } from './folders.query'
import { folderKeys } from './keys'

function sortFolders(folders: FolderListItem[]) {
  return folders.slice().sort((a, b) => {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    if (a.id < b.id) return -1
    if (a.id > b.id) return 1

    return 0
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (name: string) => createFolder({ data: { name } }),
    onSuccess: (folder) => {
      queryClient.setQueryData(folderListQueryOptions().queryKey, (folders) => {
        const next = (folders ?? []).filter(item => item.id !== folder.id)

        return sortFolders([...next, { ...folder, noteCount: 0 }])
      })
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() })

      return navigate({ to: '/notes', search: { folder: folder.id } })
    },
  })
}

export function useRenameFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { folderId: string, name: string }) =>
      renameFolder({ data: input }),
    onSuccess: (folder) => {
      queryClient.setQueryData(folderListQueryOptions().queryKey, folders =>
        folders && sortFolders(folders.map(item =>
          item.id === folder.id
            ? { ...item, name: folder.name, updatedAt: folder.updatedAt }
            : item
        ))
      )
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()

  return useMutation({
    mutationFn: (input: { folderId: string, deleteNotes: boolean }) =>
      deleteFolder({ data: input }),
    onSuccess: async (result) => {
      if (result.deleteNotes) {
        for (const noteId of result.deletedNoteIds) discardSaveQueue(noteId)
        removeCachedNotes(queryClient, result.deletedNoteIds)
        void queryClient.invalidateQueries({ queryKey: noteKeys.recent() })
        void queryClient.invalidateQueries({ queryKey: noteKeys.searches() })
        void queryClient.invalidateQueries({ queryKey: noteKeys.count() })
      } else {
        await clearCachedNoteFolder(queryClient, result.folderId)
      }

      const noteMatch = router.state.matches.find(match =>
        match.routeId === '/_authed/_app/notes/$noteId'
      )
      const notesMatch = router.state.matches.find(match =>
        match.routeId === '/_authed/_app/notes'
      )
      const noteId = noteMatch?.params.noteId
      const folder = notesMatch?.search.folder
      const viewingDeletedNote = typeof noteId === 'string'
        && result.deletedNoteIds.includes(noteId)

      // Leave the folder row in place until navigation finishes. Removing it
      // first makes the open list title fall back to "Folder".
      if (viewingDeletedNote) {
        await navigate({ to: '/notes', search: {}, replace: true })
      } else if (notesMatch && folder === result.folderId) {
        await navigate(
          typeof noteId === 'string'
            ? {
                to: '/notes/$noteId',
                params: { noteId },
                search: {},
                replace: true,
              }
            : { to: '/notes', search: {}, replace: true }
        )
      }

      queryClient.setQueryData(folderListQueryOptions().queryKey, folders =>
        folders?.filter(item => item.id !== result.folderId)
      )
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() })
      void queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}
