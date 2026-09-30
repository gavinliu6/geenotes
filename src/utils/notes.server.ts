import { and, asc, desc, eq, gt, isNull, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { note, noteView } from '@/db/schema'

import type {
  ListNotesParams,
  NoteChanges,
  NoteListItem,
  NoteSortBy,
  SortDirection
} from './schemas'

const PAGE_SIZE = 50
const RECENT_NOTES_LIMIT = 20
const SEARCH_LIMIT = 20
const VIEW_THROTTLE_MS = 30_000

const sortColumns = {
  'created-time': note.createdAt,
  'updated-time': note.updatedAt,
  'title': note.title,
}

interface Cursor {
  id: string
  value: string | number
}

export async function selectNotes(
  userId: string,
  { sortBy, direction, cursor }: ListNotesParams
) {
  const order = direction === 'asc' ? asc : desc

  const rows = await db.query.note.findMany({
    columns: { id: true, title: true, createdAt: true, updatedAt: true },
    where: and(
      eq(note.userId, userId),
      isNull(note.deletedAt),
      cursor
        ? afterCursor(decodeCursor(cursor, sortBy), sortBy, direction)
        : undefined
    ),
    orderBy: [order(sortColumns[sortBy]), order(note.id)],
    limit: PAGE_SIZE + 1,
  })

  const hasMore = rows.length > PAGE_SIZE
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows
  const nextCursor = hasMore ? encodeCursor(rows[PAGE_SIZE - 1], sortBy) : null

  return { items, nextCursor }
}

export function selectNote(userId: string, noteId: string) {
  return db.query.note.findFirst({
    columns: {
      id: true,
      title: true,
      markdown: true,
      createdAt: true,
      updatedAt: true,
    },
    where: and(
      eq(note.id, noteId),
      eq(note.userId, userId),
      isNull(note.deletedAt)
    ),
  })
}

export async function insertNote(userId: string) {
  const [row] = await db
    .insert(note)
    .values({ userId })
    .returning({ id: note.id })

  return row
}

export async function updateNote(
  userId: string,
  noteId: string,
  changes: NoteChanges
) {
  const rows = await db
    .update(note)
    .set(changes)
    .where(
      and(
        eq(note.id, noteId),
        eq(note.userId, userId),
        isNull(note.deletedAt)
      )
    )
    .returning({ id: note.id, updatedAt: note.updatedAt })

  return rows.at(0)
}

export async function hardDeleteNote(userId: string, noteId: string) {
  const rows = await db
    .delete(note)
    .where(
      and(
        eq(note.id, noteId),
        eq(note.userId, userId),
        isNull(note.deletedAt)
      )
    )
    .returning({ id: note.id })

  return rows.at(0)
}

export function selectMatchingNotes(userId: string, query: string) {
  const pattern = `%${escapeLike(query)}%`
  const titleMatches = sql`${note.title} like ${pattern} escape '\\'`
  const markdownMatches = sql`${note.markdown} like ${pattern} escape '\\'`

  return db.query.note.findMany({
    columns: { id: true, title: true, createdAt: true, updatedAt: true },
    where: and(
      eq(note.userId, userId),
      isNull(note.deletedAt),
      or(titleMatches, markdownMatches)
    ),
    orderBy: [desc(titleMatches), desc(note.updatedAt), desc(note.id)],
    limit: SEARCH_LIMIT,
  })
}

export function selectRecentNotes(userId: string) {
  return db
    .select({
      id: note.id,
      title: note.title,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      viewedAt: noteView.viewedAt,
    })
    .from(noteView)
    .innerJoin(note, eq(note.id, noteView.noteId))
    .where(and(eq(noteView.userId, userId), isNull(note.deletedAt)))
    .orderBy(desc(noteView.viewedAt), desc(noteView.noteId))
    .limit(RECENT_NOTES_LIMIT)
}

export async function upsertNoteView(userId: string, noteId: string) {
  const now = new Date()

  await db
    .insert(noteView)
    .select(qb =>
      qb
        .select({
          userId: sql`${userId}`.as('user_id'),
          noteId: note.id,
          viewedAt: sql`${now.getTime()}`.as('viewed_at'),
        })
        .from(note)
        .where(
          and(
            eq(note.id, noteId),
            eq(note.userId, userId),
            isNull(note.deletedAt)
          )
        )
    )
    .onConflictDoUpdate({
      target: [noteView.userId, noteView.noteId],
      set: { viewedAt: now },
      setWhere: lt(noteView.viewedAt, new Date(now.getTime() - VIEW_THROTTLE_MS)),
    })
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, char => `\\${char}`)
}

function afterCursor(
  { id, value }: Cursor,
  sortBy: NoteSortBy,
  direction: SortDirection
) {
  const compare = direction === 'asc' ? gt : lt
  const sortColumn = sortColumns[sortBy]
  const sortValue = typeof value === 'number' ? new Date(value) : value

  return or(
    compare(sortColumn, sortValue),
    and(eq(sortColumn, sortValue), compare(note.id, id))
  )
}

function encodeCursor(item: NoteListItem, sortBy: NoteSortBy) {
  const value
    = sortBy === 'title'
      ? item.title
      : (sortBy === 'created-time' ? item.createdAt : item.updatedAt).getTime()

  return encodeBase64(JSON.stringify({ id: item.id, value } satisfies Cursor))
}

function decodeCursor(cursor: string, sortBy: NoteSortBy): Cursor {
  const schema = z.object({
    id: z.string(),
    value: sortBy === 'title' ? z.string() : z.number(),
  })

  try {
    return schema.parse(JSON.parse(decodeBase64(cursor)))
  } catch {
    throw new Error('Invalid cursor')
  }
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value)

  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
}

function decodeBase64(value: string) {
  const bytes = Uint8Array.from(atob(value), char => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}
