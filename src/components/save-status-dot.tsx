import { onlineManager } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { Focusable } from 'react-aria-components/Focusable'

import type { SaveStatus } from '@/components/editor/save-queue'
import { useSaveState } from '@/components/editor/save-status'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** How long the green "saved" state stays before the dot fades out. */
const SAVED_HOLD_MS = 800

type DotState = 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'offline'

const descriptions: Record<
  Exclude<DotState, 'idle'>,
  { label: string, hint?: string }
> = {
  pending: { label: 'Unsaved changes', hint: '⌘S to save now' },
  saving: { label: 'Saving…' },
  saved: { label: 'Saved' },
  error: { label: 'Failed to save', hint: '⌘S to retry' },
  offline: { label: 'Offline', hint: 'Saves once you\'re back online' },
}

const dotStyles: Record<DotState, string> = {
  idle: 'bg-success',
  pending: 'bg-warning',
  saving: 'bg-warning',
  saved: 'bg-success',
  error: 'bg-danger',
  offline: 'border-warning',
}

/** Shows the autosave state of the open note; only a slow request makes it breathe. */
export function SaveStatusDot({ noteId }: { noteId: string }) {
  const state = useSaveState(noteId)
  const isOnline = useIsOnline()
  const isFresh = useIsFreshSave(state?.savedAt)
  const dot = getDotState(state?.status ?? 'idle', isOnline, isFresh)
  const description = dot === 'idle' ? undefined : descriptions[dot]

  return (
    <Tooltip isDisabled={!description}>
      <Focusable excludeFromTabOrder>
        <span
          role="img"
          aria-label={description?.label ?? 'Saved'}
          className={cn(
            `
              relative size-2 shrink-0 transition-opacity duration-enter
              ease-fluid-out outline-none
            `,
            dot === 'idle' && 'opacity-0 duration-exit'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              `
                absolute inset-0 rounded-full border-[1.5px] border-transparent
                transition-[background-color,border-color,opacity] duration-exit
                ease-fluid-out
              `,
              dotStyles[dot],
              dot === 'saving' && `
                opacity-0 [transition-delay:0ms,0ms,400ms]
                motion-reduce:opacity-100
              `
            )}
          />
          {/* Keep the current animation frame while its layer fades out. */}
          <span
            aria-hidden="true"
            className={cn(
              `
                absolute inset-0 transition-opacity duration-exit ease-fluid-out
                motion-reduce:hidden
              `,
              dot === 'saving' ? 'opacity-100 delay-400' : 'opacity-0'
            )}
          >
            <span
              className="
                block size-full animate-save-breathe rounded-full bg-warning
                motion-reduce:animate-none
              "
              style={{ animationPlayState: dot === 'saving' ? 'running' : 'paused' }}
            />
          </span>
        </span>
      </Focusable>
      <TooltipContent hideArrow placement="bottom">
        {description?.label}
        {description?.hint && ` · ${description.hint}`}
      </TooltipContent>
    </Tooltip>
  )
}

function getDotState(
  status: SaveStatus,
  isOnline: boolean,
  isFresh: boolean
): DotState {
  if (status === 'idle') return isFresh ? 'saved' : 'idle'
  if (status !== 'error' && !isOnline) return 'offline'

  return status
}

function useIsFreshSave(savedAt: number | undefined) {
  const subscribe = useCallback((listener: () => void) => {
    if (savedAt === undefined) return () => {}

    // Reopening a note must use the remainder of its original success feedback.
    const remaining = savedAt + SAVED_HOLD_MS - Date.now()
    if (remaining <= 0) return () => {}

    const id = setTimeout(listener, remaining)

    return () => clearTimeout(id)
  }, [savedAt])

  return useSyncExternalStore(
    subscribe,
    () => savedAt !== undefined && Date.now() < savedAt + SAVED_HOLD_MS,
    () => false
  )
}

function useIsOnline() {
  return useSyncExternalStore(
    listener => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
    () => true
  )
}
