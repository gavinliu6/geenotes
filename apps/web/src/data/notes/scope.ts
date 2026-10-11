import { useRouterState } from '@tanstack/react-router'

import type { NoteListScope } from '@/utils/schemas'

export const allNotesScope: NoteListScope = { kind: 'all' }

export function scopeFromFolder(folder?: string): NoteListScope {
  return folder ? { kind: 'folder', folderId: folder } : allNotesScope
}

export function sameNoteListScope(a: NoteListScope, b: NoteListScope) {
  if (a.kind === 'folder' && b.kind === 'folder') return a.folderId === b.folderId

  return a.kind === 'all' && b.kind === 'all'
}

/** Search to pass when opening a note list. An empty object clears `folder`. */
export function noteListSearch(scope: NoteListScope): { folder?: string } {
  return scope.kind === 'folder' ? { folder: scope.folderId } : {}
}

export function useCurrentNoteScope(): NoteListScope {
  const folder = useRouterState({
    select: (state) => {
      const match = state.matches.find(item => item.routeId === '/_authed/_app/notes')

      return match?.search.folder
    },
  })

  return scopeFromFolder(folder)
}
