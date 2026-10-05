import { useQueryClient } from '@tanstack/react-query'
import { isNotFound, useHydrated } from '@tanstack/react-router'
import type * as React from 'react'
import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react'

import { Loader } from '@/components/ui/loader'
import { toastManager } from '@/components/ui/toast'
import { applyNoteChanges, useSaveNote } from '@/data/notes/notes.mutation'
import type { Note } from '@/utils/schemas'
import { NOTE_TITLE_MAX_LENGTH } from '@/utils/schemas'

import { useEditLock } from './edit-lock'
import type { MarkdownEditorHandle } from './markdown-editor'
import { MarkdownEditor } from './markdown-editor'
import { createSaveQueue } from './save-queue'
import { getSaveQueue, registerSaveQueue } from './save-status'

type EditableNote = Pick<Note, 'id' | 'title' | 'markdown'>

export interface NoteEditorHandle {
  /** Saves pending edits and resolves once every save has settled. */
  flush: () => Promise<void>
  setLocked: (isLocked: boolean) => void
}

interface NoteEditorProps {
  ref?: React.Ref<NoteEditorHandle>
  note: EditableNote
  titleActions?: React.ReactNode
  onLockedChange?: (isLocked: boolean) => void
}

/** Mount with `key={note.id}`: the note is only read on mount. */
export function NoteEditor({ ref, note, titleActions, onLockedChange }: NoteEditorProps) {
  const autosave = useAutosave(note)
  const [draft] = useState(() => autosave.getDraft())
  const [title, setTitle] = useState(draft.title)
  const [initialMarkdown] = useState(draft.markdown)
  const [isNew] = useState(!draft.title && !draft.markdown)
  const isHydrated = useHydrated()
  const [isLoading, setIsLoading] = useState(!isHydrated)
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<MarkdownEditorHandle>(null)
  const { isLocked, setLocked, markInput } = useEditLock({
    containerRef: rootRef,
    initiallyLocked: !isNew,
    onUnlock: () => {
      if (document.activeElement !== titleRef.current) bodyRef.current?.focus()
    },
  })
  const reportLocked = useEffectEvent((locked: boolean) => {
    onLockedChange?.(locked)
  })

  useImperativeHandle(ref, () => ({ flush: autosave.flush, setLocked }), [autosave, setLocked])

  useEffect(() => {
    reportLocked(isLocked)
  }, [isLocked])

  useEffect(() => {
    if (isNew && !isLoading) titleRef.current?.focus()
  }, [isNew, isLoading])

  const changeTitle = (value: string) => {
    markInput()
    setTitle(value)
    autosave.setTitle(value)
  }

  const changeMarkdown = (serialize: () => string) => {
    markInput()
    autosave.setMarkdown(serialize)
  }

  const focusTitleEnd = () => {
    const input = titleRef.current

    if (!input) return

    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isLocked || event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.altKey || event.ctrlKey || event.metaKey) return

    const { value, selectionStart, selectionEnd } = event.currentTarget

    if (event.key === 'Enter') {
      event.preventDefault()

      const head = value.slice(0, selectionStart)
      const rest = value.slice(selectionEnd)

      if (!bodyRef.current?.prependText(rest)) return
      if (head !== value) changeTitle(head)

      return
    }

    const isCaretAtEnd
      = selectionStart === selectionEnd && selectionEnd === value.length

    if (
      (event.key === 'ArrowDown' || event.key === 'ArrowRight')
      && !event.shiftKey
      && isCaretAtEnd
    ) {
      event.preventDefault()
      bodyRef.current?.focusStart()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (isLocked) return

    const text = event.clipboardData.getData('text/plain')
    const [firstLine = '', ...lines] = text.split(/\r?\n/)
    const rest = lines.join('\n').trim()

    if (lines.length === 0) return
    if (rest && !bodyRef.current?.prependMarkdown(rest)) return

    event.preventDefault()

    const input = event.currentTarget
    const { value, selectionStart, selectionEnd } = input
    const next = (
      value.slice(0, selectionStart) + firstLine + value.slice(selectionEnd)
    ).slice(0, NOTE_TITLE_MAX_LENGTH)
    const caret = Math.min(selectionStart + firstLine.length, next.length)

    changeTitle(next)
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(caret, caret)
    })
  }

  return (
    <div ref={rootRef} className="flex grow flex-col">
      <div className={isLoading ? 'invisible h-0' : 'flex grow flex-col'}>
        <div className="flex flex-wrap items-center gap-2 border-b pb-3">
          <div
            data-value={title}
            className="
              grid min-w-0 grow text-[2rem]/10 tracking-tight
              after:invisible after:col-start-1 after:row-start-1
              after:wrap-break-word after:whitespace-pre-wrap
              after:content-[attr(data-value)_'_']
            "
          >
            <textarea
              ref={titleRef}
              rows={1}
              value={title}
              readOnly={isLocked}
              maxLength={NOTE_TITLE_MAX_LENGTH}
              aria-label="Title"
              placeholder="Untitled"
              className="
                col-start-1 row-start-1 resize-none overflow-hidden
                bg-transparent wrap-break-word outline-none
                placeholder:text-fg-muted
              "
              onChange={event =>
                changeTitle(event.target.value.replace(/[\r\n]+/g, ' '))}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
            />
          </div>
          {titleActions}
        </div>
        <MarkdownEditor
          ref={bodyRef}
          defaultValue={initialMarkdown}
          placeholder="Press `/` for commands"
          aria-label="Note"
          className="mt-4 grow"
          readOnly={isLocked}
          onChange={changeMarkdown}
          onExitStart={focusTitleEnd}
          onReady={() => setIsLoading(false)}
        />
      </div>
      {isLoading && <Loader aria-label="Loading note" className="m-auto" />}
    </div>
  )
}

function useAutosave(note: EditableNote) {
  const queryClient = useQueryClient()
  const { mutateAsync: saveNote } = useSaveNote(note.id)
  const [queue] = useState(() =>
    getSaveQueue(note.id) ?? createSaveQueue({
      saved: { title: note.title, markdown: note.markdown },
      save: saveNote,
      onQueued: changes => applyNoteChanges(queryClient, note.id, changes),
      onError: () => {
        toastManager.add({ type: 'error', description: 'Failed to save note' })
      },
      shouldRetry: error => !isNotFound(error),
    })
  )

  useEffect(() => registerSaveQueue(note.id, queue), [note.id, queue])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSaveShortcut(event)) return

      event.preventDefault()
      if (!event.repeat) void queue.flush({ manual: true })
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [queue])

  return queue
}

/** ⌘S / Ctrl+S, which the browser would otherwise turn into "Save Page As". */
function isSaveShortcut(event: KeyboardEvent) {
  return (
    event.key.toLowerCase() === 's'
    && (event.metaKey || event.ctrlKey)
    && !event.altKey
    && !event.shiftKey
  )
}
