import type * as React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { Kbd } from '@/components/ui/kbd'
import { toastManager } from '@/components/ui/toast'

const IDLE_MS = 5 * 60 * 1000
const DOUBLE_PRESS_MS = 500

interface EditLockOptions {
  /** Wraps the title and the body. */
  containerRef: React.RefObject<HTMLElement | null>
  initiallyLocked: boolean
  /** Called after pressing `i` twice unlocks the note. */
  onUnlock: () => void
}

/** Keeps a note read-only until `i` is pressed twice or `setLocked(false)` is called; Escape or five minutes without input lock it again. */
export function useEditLock({ containerRef, initiallyLocked, onUnlock }: EditLockOptions) {
  const [isLocked, setLocked] = useState(initiallyLocked)
  const lastInputAt = useRef(0)
  const unlockedByKey = useRef(false)
  const handleUnlock = useEffectEvent(onUnlock)

  useEffect(() => {
    const container = containerRef.current

    if (!isLocked || !container) return

    let lastPressAt = -Infinity

    const onKeyDown = (event: KeyboardEvent) => {
      const { target } = event

      if (event.defaultPrevented || event.isComposing || isInOtherField(target, container)) return

      const isPlain = !event.metaKey && !event.ctrlKey && !event.altKey

      if (isPlain && event.key.toLowerCase() === 'i') {
        if (event.repeat) return

        if (event.timeStamp - lastPressAt < DOUBLE_PRESS_MS) {
          event.preventDefault()
          unlockedByKey.current = true
          setLocked(false)
        } else {
          lastPressAt = event.timeStamp
        }

        return
      }

      lastPressAt = -Infinity

      if (isPlain && isEditKey(event.key) && isOnNote(target, container)) showLockedHint()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isLocked, containerRef])

  useEffect(() => {
    if (isLocked || !unlockedByKey.current) return

    unlockedByKey.current = false
    handleUnlock()
  }, [isLocked])

  useEffect(() => {
    const container = containerRef.current

    if (isLocked || !container) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let isComposing = false

    const idleFor = () => Date.now() - lastInputAt.current
    const isBusy = () => isComposing || isInEditorField(container)

    const check = () => {
      const idle = idleFor()

      if (idle >= IDLE_MS && !isBusy()) setLocked(true)
      else timer = setTimeout(check, idle >= IDLE_MS ? IDLE_MS : IDLE_MS - idle)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.target instanceof Node) || !container.contains(event.target)) return

      if (idleFor() < IDLE_MS || isBusy()) {
        lastInputAt.current = Date.now()

        return
      }

      setLocked(true)

      if (!event.metaKey && !event.ctrlKey && !event.altKey && isEditKey(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        showLockedHint()
      }
    }

    const lockOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !event.isComposing && !isBusy()) setLocked(true)
    }

    const onEscapeCapture = (event: KeyboardEvent) => {
      if (isProseMirrorTarget(event.target)) lockOnEscape(event)
    }

    const onEscape = (event: KeyboardEvent) => {
      if (isOnNote(event.target, container) && !isProseMirrorTarget(event.target)) lockOnEscape(event)
    }

    const onCompositionStart = () => {
      isComposing = true
    }

    const onCompositionEnd = () => {
      isComposing = false
    }

    lastInputAt.current = Date.now()
    timer = setTimeout(check, IDLE_MS)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keydown', onEscape)
    container.addEventListener('keydown', onEscapeCapture, true)
    container.addEventListener('compositionstart', onCompositionStart)
    container.addEventListener('compositionend', onCompositionEnd)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keydown', onEscape)
      container.removeEventListener('keydown', onEscapeCapture, true)
      container.removeEventListener('compositionstart', onCompositionStart)
      container.removeEventListener('compositionend', onCompositionEnd)
    }
  }, [isLocked, containerRef])

  const markInput = () => {
    lastInputAt.current = Date.now()
  }

  return { isLocked, setLocked, markInput }
}

function isEditKey(key: string) {
  return (key.length === 1 && key !== ' ') || key === 'Backspace' || key === 'Delete' || key === 'Enter'
}

/** Text fields and popups elsewhere on the page keep their keys. */
function isInOtherField(target: EventTarget | null, container: HTMLElement) {
  return (
    target instanceof HTMLElement
    && !container.contains(target)
    && (target.isContentEditable
      || target.closest('input, textarea, select, [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]') !== null)
  )
}

/** ProseMirror prevents every Escape it receives, so its keys are checked before it runs; code blocks handle their own. */
function isProseMirrorTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest('.ProseMirror') !== null && target.closest('.cm-editor') === null
}

function isOnNote(target: EventTarget | null, container: HTMLElement) {
  return target === document.body || (target instanceof Node && container.contains(target))
}

/** An input inside the editor, like the link field, that locking would leave half-typed. */
function isInEditorField(container: HTMLElement) {
  const active = document.activeElement

  return active !== null && container.contains(active) && active.closest('.milkdown :is(input, textarea, select)') !== null
}

function showLockedHint() {
  toastManager.add({
    id: 'edit-lock',
    description: (
      <>
        Press <Kbd>i</Kbd> twice to edit
      </>
    ),
    timeout: 3000,
  })
}
