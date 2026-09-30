import { and, eq, isNotNull } from 'drizzle-orm'

import { db } from '@/db'
import { account } from '@/db/schema'

export async function selectHasPassword(userId: string) {
  const credential = await db.query.account.findFirst({
    columns: { id: true },
    where: and(
      eq(account.userId, userId),
      eq(account.providerId, 'credential'),
      isNotNull(account.password)
    ),
  })

  return credential !== undefined
}
