import { onlineManager } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'
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
  idle: 'opacity-0 duration-500',
  pending: 'bg-warning',
  saving: 'bg-warning animate-save-breathe',
  saved: 'bg-success',
  error: 'bg-danger',
  offline: 'border-warning',
}

/** Shows the autosave state of the open note; only a slow request makes it breathe. */
export function SaveStatusDot({ noteId }: { noteId: string }) {
  const state = useSaveState(noteId)
  const isOnline = useIsOnline()
  const savedAt = state?.savedAt
  const [expiredAt, setExpiredAt] = useState(savedAt)

  useEffect(() => {
    if (savedAt === undefined) return

    const id = setTimeout(() => setExpiredAt(savedAt), SAVED_HOLD_MS)

    return () => clearTimeout(id)
  }, [savedAt])

  const dot = getDotState(
    state?.status ?? 'idle',
    isOnline,
    savedAt !== undefined && savedAt !== expiredAt
  )
  const description = dot === 'idle' ? undefined : descriptions[dot]

  return (
    <Tooltip isDisabled={!description}>
      <Focusable excludeFromTabOrder>
        <span
          role="img"
          aria-label={description?.label ?? 'Saved'}
          className={cn(
            `
              size-2 shrink-0 rounded-full border-[1.5px] border-transparent
              transition-[background-color,border-color,opacity] duration-150
              outline-none
              motion-reduce:[--breathe-scale:1]
            `,
            dotStyles[dot]
          )}
        />
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

function useIsOnline() {
  return useSyncExternalStore(
    listener => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
    () => true
  )
}
