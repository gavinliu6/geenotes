import type { NoteListQuery } from './types'

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (query: NoteListQuery) => [...noteKeys.lists(), query] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (noteId: string) => [...noteKeys.details(), noteId] as const,
  recent: () => [...noteKeys.all, 'recent'] as const,
}
