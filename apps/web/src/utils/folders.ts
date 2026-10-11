import {
  FOLDER_NAME_TAKEN_MESSAGE,
  FOLDER_UNAVAILABLE_MESSAGE
} from '@/utils/schemas'

const knownFolderErrors = new Set([
  FOLDER_NAME_TAKEN_MESSAGE,
  FOLDER_UNAVAILABLE_MESSAGE,
])

/** Shows a folder error only when the server sent one of the stable messages. */
export function folderErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object'
      && error !== null
      && 'message' in error
      && typeof error.message === 'string'
      ? error.message
      : undefined

  return message && knownFolderErrors.has(message) ? message : fallback
}
