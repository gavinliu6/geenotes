import type { NoteChanges } from '@/utils/schemas'

export const SAVE_DELAY_MS = 2000
export const MAX_SAVE_DELAY_MS = 10_000
export const RETRY_DELAY_MS = 5000

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'error'

export interface SaveState {
  status: SaveStatus
  /** Set whenever a save, or a manual flush, confirms that nothing is left to save. */
  savedAt?: number
}

interface SavedNote {
  title: string
  markdown: string
}

interface SaveQueueOptions {
  saved: SavedNote
  save: (changes: NoteChanges) => Promise<unknown>
  /** Receives flushed changes that have to wait for an earlier save to settle. */
  onQueued?: (changes: NoteChanges) => void
  /** Called on the first failure after a success, and whenever a manual flush fails. */
  onError?: (error: unknown) => void
  shouldRetry?: (error: unknown) => boolean
}

interface FlushOptions {
  /** A save the user asked for: its failure is always reported. */
  manual?: boolean
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
  let state: SaveState = { status: 'idle' }
  const listeners = new Set<() => void>()

  function hasPendingChanges() {
    return title !== undefined || serialize !== undefined
  }

  function getStatus(): SaveStatus {
    if (running) return 'saving'
    if (hasFailed) return 'error'
    if (hasPendingChanges()) return 'pending'

    return 'idle'
  }

  function publish(savedAt?: number) {
    const next: SaveState = {
      status: getStatus(),
      savedAt: savedAt ?? state.savedAt,
    }

    if (next.status === state.status && next.savedAt === state.savedAt) return

    state = next
    listeners.forEach(listener => listener())
  }

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

  async function flush({ manual = false }: FlushOptions = {}) {
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

    if (!changes) {
      publish(manual && !hasFailed ? Date.now() : undefined)

      return
    }

    running = save(changes)
      .then(
        () => {
          saved = { ...saved, ...changes }
          hasFailed = false

          return true
        },
        (error: unknown) => {
          if (shouldRetry(error)) {
            const { markdown } = changes

            title ??= changes.title
            if (markdown !== undefined) serialize ??= () => markdown
            schedule(RETRY_DELAY_MS)
          }

          if (!hasFailed || manual) onError?.(error)
          hasFailed = true

          return false
        }
      )
      .then((succeeded) => {
        running = undefined
        publish(succeeded && !hasPendingChanges() ? Date.now() : undefined)
      })
    publish()

    await running
  }

  return {
    setTitle(value: string) {
      title = value
      schedule()
      publish()
    },
    setMarkdown(value: () => string) {
      serialize = value
      schedule()
      publish()
    },
    flush,
    hasUnsavedChanges() {
      return hasPendingChanges() || running !== undefined
    },
    getState() {
      return state
    },
    subscribe(listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}
