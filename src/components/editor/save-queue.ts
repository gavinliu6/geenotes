import type { NoteChanges } from '@/utils/schemas'

export const SAVE_DELAY_MS = 2000
export const MAX_SAVE_DELAY_MS = 10_000
export const RETRY_DELAY_MS = 5000

interface SavedNote {
  title: string
  markdown: string
}

interface SaveQueueOptions {
  saved: SavedNote
  save: (changes: NoteChanges) => Promise<unknown>
  /** Receives flushed changes that have to wait for an earlier save to settle. */
  onQueued?: (changes: NoteChanges) => void
  /** Called on the first failure after a success. */
  onError?: (error: unknown) => void
  shouldRetry?: (error: unknown) => boolean
}

export type SaveQueue = ReturnType<typeof createSaveQueue>

/** Debounces note edits (saving at least every `MAX_SAVE_DELAY_MS`) and saves them one request at a time, skipping values the server already has. */
export function createSaveQueue({
  saved: initial,
  save,
  onQueued,
  onError,
  shouldRetry = () => true,
}: SaveQueueOptions) {
  let saved = initial
  let title: string | undefined
  let serialize: (() => string) | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let dueAt: number | undefined
  let running: Promise<void> | undefined
  let hasFailed = false

  function schedule(delay = SAVE_DELAY_MS) {
    dueAt ??= Date.now() + MAX_SAVE_DELAY_MS
    clearTimeout(timer)
    timer = setTimeout(() => void flush(), Math.min(delay, dueAt - Date.now()))
  }

  function collect() {
    const changes: NoteChanges = {}

    if (title !== undefined && title !== saved.title) changes.title = title

    if (serialize) {
      const markdown = serialize()

      serialize = () => markdown

      if (markdown !== saved.markdown) changes.markdown = markdown
    }

    return Object.keys(changes).length > 0 ? changes : undefined
  }

  async function flush() {
    clearTimeout(timer)
    dueAt = undefined

    if (running) {
      const changes = collect()

      if (changes) onQueued?.(changes)
    }

    while (running) await running

    const changes = collect()

    title = undefined
    serialize = undefined

    if (!changes) return

    running = save(changes)
      .then(
        () => {
          saved = { ...saved, ...changes }
          hasFailed = false
        },
        (error: unknown) => {
          if (shouldRetry(error)) {
            const { markdown } = changes

            title ??= changes.title
            if (markdown !== undefined) serialize ??= () => markdown
            schedule(RETRY_DELAY_MS)
          }

          if (!hasFailed) onError?.(error)
          hasFailed = true
        }
      )
      .finally(() => {
        running = undefined
      })

    await running
  }

  return {
    setTitle(value: string) {
      title = value
      schedule()
    },
    setMarkdown(value: () => string) {
      serialize = value
      schedule()
    },
    flush,
    hasUnsavedChanges() {
      return title !== undefined || serialize !== undefined || running !== undefined
    },
  }
}
