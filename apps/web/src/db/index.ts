import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema.ts'

export const db = drizzle(env.D1, {
  schema,
  casing: 'snake_case',
})
