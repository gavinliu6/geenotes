import { env } from 'cloudflare:workers'
import { ulid } from 'ulid'

export async function putUpload(userId: string, file: File) {
  const key = ulid()

  await env.R2.put(key, file, {
    httpMetadata: { contentType: file.type },
    customMetadata: { userId },
  })

  return key
}

/** Resolves to `null` when the object is missing or belongs to another user. */
export async function getUpload(userId: string, key: string, onlyIf?: Headers) {
  const object = await env.R2.get(key, { onlyIf })

  return object?.customMetadata?.userId === userId ? object : null
}
