import type { SaveQueue } from './save-queue'

interface Entry {
  queue: SaveQueue
  owners: number
  unsubscribe: () => void
}

/** Retains unfinished saves independently of the currently mounted editor. */
export function createSaveQueueRegistry() {
  const entries = new Map<string, Entry>()
  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach(listener => listener())
  }

  function releaseIfIdle(noteId: string, entry: Entry) {
    if (
      entries.get(noteId) !== entry
      || entry.owners > 0
      || entry.queue.hasUnsavedChanges()
    ) return

    entry.unsubscribe()
    entries.delete(noteId)
  }

  return {
    get size() {
      return entries.size
    },
    get(noteId: string) {
      return entries.get(noteId)?.queue
    },
    register(noteId: string, queue: SaveQueue) {
      let entry = entries.get(noteId)

      if (!entry) {
        entry = { queue, owners: 0, unsubscribe: () => {} }
        const registered = entry

        entry.unsubscribe = queue.subscribe(() => {
          releaseIfIdle(noteId, registered)
          notify()
        })
        entries.set(noteId, entry)
      }

      const registered = entry

      registered.owners++
      notify()

      return () => {
        registered.owners--
        // flush collects Markdown synchronously, before the editor's serializer is destroyed.
        void registered.queue.flush()
        releaseIfIdle(noteId, registered)
        notify()
      }
    },
    discard(noteId: string) {
      const entry = entries.get(noteId)

      if (!entry) return

      entry.unsubscribe()
      entries.delete(noteId)
      entry.queue.dispose()
      notify()
    },
    async flush() {
      await Promise.all([...entries.values()].map(({ queue }) => queue.flush()))
    },
    hasUnsavedChanges() {
      return [...entries.values()].some(({ queue }) => queue.hasUnsavedChanges())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}
