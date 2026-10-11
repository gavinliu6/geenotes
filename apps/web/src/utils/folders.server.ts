import { and, asc, eq, exists, isNull, sql } from 'drizzle-orm'

import { db } from '@/db'
import { folder, note } from '@/db/schema'
import type { FolderListItem } from '@/utils/schemas'
import {
  FOLDER_NAME_TAKEN_MESSAGE,
  FOLDER_UNAVAILABLE_MESSAGE
} from '@/utils/schemas'

export async function selectFolders(userId: string): Promise<FolderListItem[]> {
  const rows = await db
    .select({
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      noteCount: sql<number>`count(${note.id})`.mapWith(Number),
    })
    .from(folder)
    .leftJoin(
      note,
      and(
        eq(note.folderId, folder.id),
        eq(note.userId, userId),
        isNull(note.deletedAt)
      )
    )
    .where(eq(folder.userId, userId))
    .groupBy(folder.id, folder.name, folder.createdAt, folder.updatedAt)
    .orderBy(asc(folder.name), asc(folder.id))

  return rows
}

export async function insertFolder(userId: string, name: string) {
  try {
    const [row] = await db
      .insert(folder)
      .values({ userId, name })
      .returning({
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      })

    return row
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error(FOLDER_NAME_TAKEN_MESSAGE)

    throw error
  }
}

export async function updateFolderName(
  userId: string,
  folderId: string,
  name: string
) {
  try {
    const rows = await db
      .update(folder)
      .set({ name })
      .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
      .returning({
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      })
    const row = rows.at(0)

    if (!row) throw new Error(FOLDER_UNAVAILABLE_MESSAGE)

    return row
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error(FOLDER_NAME_TAKEN_MESSAGE)

    throw error
  }
}

export async function removeFolder(
  userId: string,
  folderId: string,
  deleteNotes: boolean
) {
  if (!deleteNotes) {
    const rows = await db
      .delete(folder)
      .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
      .returning({ id: folder.id })

    if (!rows.length) throw new Error(FOLDER_UNAVAILABLE_MESSAGE)

    return { folderId, deleteNotes: false, deletedNoteIds: [] as string[] }
  }

  const ownedFolder = exists(
    db
      .select({ id: folder.id })
      .from(folder)
      .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
  )

  const [deletedNotes, deletedFolders] = await db.batch([
    db
      .delete(note)
      .where(and(
        eq(note.userId, userId),
        eq(note.folderId, folderId),
        isNull(note.deletedAt),
        ownedFolder
      ))
      .returning({ id: note.id }),
    db
      .delete(folder)
      .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
      .returning({ id: folder.id }),
  ]) as [{ id: string }[], { id: string }[]]

  if (!deletedFolders.length) throw new Error(FOLDER_UNAVAILABLE_MESSAGE)

  return {
    folderId,
    deleteNotes: true,
    deletedNoteIds: deletedNotes.map(row => row.id),
  }
}

function isUniqueConstraintError(error: unknown) {
  const seen = new Set<unknown>()
  let current: unknown = error

  while (current instanceof Error && !seen.has(current)) {
    seen.add(current)

    if (
      current.message.includes('UNIQUE constraint failed')
      || current.message.includes('SQLITE_CONSTRAINT')
    ) {
      return true
    }

    current = current.cause
  }

  return false
}
