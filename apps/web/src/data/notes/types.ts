import type { NoteListScope, NoteSortBy, SortDirection } from '@/utils/schemas'

export interface NoteListSort {
  sortBy: NoteSortBy
  direction: SortDirection
}

export interface NoteListQuery extends NoteListSort {
  scope: NoteListScope
}
