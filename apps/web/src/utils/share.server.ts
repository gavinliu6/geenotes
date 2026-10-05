import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm'

import { db } from '@/db'
import { note } from '@/db/schema'

/** Toggles the public link without touching `updatedAt`, which tracks content edits. */
export async function setNoteShared(
  userId: string,
  noteId: string,
  isShared: boolean
) {
  const rows = await db
    .update(note)
    .set({ sharedAt: isShared ? new Date() : null, updatedAt: sql`updated_at` })
    .where(
      and(
        eq(note.id, noteId),
        eq(note.userId, userId),
        isNull(note.deletedAt)
      )
    )
    .returning({ sharedAt: note.sharedAt })

  return rows.at(0)
}

export function selectSharedNote(noteId: string) {
  return db.query.note.findFirst({
    columns: { id: true, title: true, markdown: true, updatedAt: true },
    where: and(
      eq(note.id, noteId),
      isNotNull(note.sharedAt),
      isNull(note.deletedAt)
    ),
  })
}

/** Resolves to the owner of an upload that a shared note embeds, so visitors can load it without signing in. */
export async function selectSharedUploadOwner(key: string) {
  const row = await db.query.note.findFirst({
    columns: { userId: true },
    where: and(
      isNotNull(note.sharedAt),
      isNull(note.deletedAt),
      sql`instr(${note.markdown}, ${`/uploads/${key}`}) > 0`
    ),
  })

  return row?.userId ?? null
}
