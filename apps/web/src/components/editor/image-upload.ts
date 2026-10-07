import type { Uploader } from '@milkdown/kit/plugin/upload'

import { toastManager } from '@/components/ui/toast'
import { imageFileSchema } from '@/utils/schemas'
import { uploadImage } from '@/utils/uploads.functions'

/** Resolve with only successful images so Milkdown also clears failed upload placeholders. */
export const uploadImages: Uploader = async (files, schema) => {
  const imageType = schema.nodes['image-block']

  const nodes = await Promise.all(
    Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(async (file) => {
        const src = await uploadImageFile(file)

        return src ? imageType.createAndFill({ src }) : null
      })
  )

  return nodes.filter(node => node !== null)
}

export async function uploadImageFile(file: File) {
  try {
    imageFileSchema.parse(file)

    const data = new FormData()

    data.set('file', file)

    const { url } = await uploadImage({ data })

    return url
  } catch (error) {
    toastManager.add({ type: 'error', description: getUploadErrorMessage(error) })

    return ''
  }
}

function getUploadErrorMessage(error: unknown) {
  const message = hasMessage(error) ? error.message : String(error)

  // TanStack serializes Zod errors as plain Errors containing the JSON issue array.
  try {
    const issues: unknown = JSON.parse(message)

    if (Array.isArray(issues) && issues.length > 0 && issues.every(hasMessage)) {
      return issues[0].message
    }
  } catch {
    // Non-JSON messages are displayed unchanged.
  }

  return message
}

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object'
    && value !== null
    && 'message' in value
    && typeof value.message === 'string'
  )
}
