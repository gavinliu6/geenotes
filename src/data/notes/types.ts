import type { NoteSortBy, SortDirection } from '@/utils/schemas'

export interface NoteListQuery {
  sortBy: NoteSortBy
  direction: SortDirection
}
