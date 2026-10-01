import { useSyncExternalStore } from 'react'

import type { SaveQueue, SaveState } from './save-queue'

const queues = new Map<string, SaveQueue>()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/** Exposes a note's save queue to `useSaveState` until the returned cleanup runs. */
export function registerSaveQueue(noteId: string, queue: SaveQueue) {
  const unsubscribe = queue.subscribe(notify)

  queues.set(noteId, queue)
  notify()

  return () => {
    unsubscribe()
    if (queues.get(noteId) === queue) queues.delete(noteId)
    notify()
  }
}

/** Save state of the note whose editor is mounted, or `undefined` for any other note. */
export function useSaveState(noteId: string): SaveState | undefined {
  return useSyncExternalStore(
    subscribe,
    () => queues.get(noteId)?.getState(),
    () => undefined
  )
}
