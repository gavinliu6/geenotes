import { useSyncExternalStore } from 'react'

import type { SaveState } from './save-queue'
import { createSaveQueueRegistry } from './save-queue-registry'

// Entries are registered only by editor effects, never during SSR or an abandoned render.
const queues = createSaveQueueRegistry()
let stopListening: (() => void) | undefined

queues.subscribe(() => {
  if (queues.size === 0) {
    stopListening?.()
    stopListening = undefined

    return
  }

  if (stopListening || typeof window === 'undefined') return

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') void queues.flush()
  }
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    void queues.flush()

    if (queues.hasUnsavedChanges()) event.preventDefault()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('beforeunload', onBeforeUnload)
  stopListening = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('beforeunload', onBeforeUnload)
  }
})

export const getSaveQueue = queues.get
export const registerSaveQueue = queues.register
export const discardSaveQueue = queues.discard

/** Includes background saves so reopening a note restores its real state. */
export function useSaveState(noteId: string): SaveState | undefined {
  return useSyncExternalStore(
    queues.subscribe,
    () => queues.get(noteId)?.getState(),
    () => undefined
  )
}
