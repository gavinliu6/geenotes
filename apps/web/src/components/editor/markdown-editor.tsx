import type { Crepe } from '@milkdown/crepe'
import type { Editor } from '@milkdown/kit/core'
import { editorViewCtx, parserCtx } from '@milkdown/kit/core'
import { Fragment } from '@milkdown/kit/prose/model'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import type * as React from 'react'
import { useEffect, useEffectEvent, useImperativeHandle, useRef } from 'react'

import { cn } from '@/lib/utils'

import { focusStart, prepend } from './commands'
import { createCrepe } from './crepe'

export interface MarkdownEditorHandle {
  /** Focuses the editor where its selection was left. */
  focus: () => void
  focusStart: () => void
  /** Returns `false` while the editor is still loading. */
  prependText: (text: string) => boolean
  /** Returns `false` while the editor is still loading. */
  prependMarkdown: (markdown: string) => boolean
}

interface MarkdownEditorProps {
  'ref'?: React.Ref<MarkdownEditorHandle>
  'defaultValue': string
  'placeholder': string
  'className'?: string
  'aria-label'?: string
  'readOnly'?: boolean
  'onChange'?: (serialize: () => string) => void
  /** Called when the caret tries to leave the top of the document. */
  'onExitStart'?: () => void
  /** Called once the editor has finished loading. */
  'onReady'?: () => void
}

export function MarkdownEditor(props: MarkdownEditorProps) {
  return (
    <MilkdownProvider>
      <CrepeEditor {...props} />
    </MilkdownProvider>
  )
}

function CrepeEditor({
  ref,
  defaultValue,
  placeholder,
  className,
  'aria-label': ariaLabel,
  readOnly = false,
  onChange,
  onExitStart,
  onReady,
}: MarkdownEditorProps) {
  const crepeRef = useRef<Crepe>(null)
  const isReadOnly = useEffectEvent(() => readOnly)
  const handleChange = useEffectEvent((serialize: () => string) => {
    onChange?.(serialize)
  })
  const handleExitStart = useEffectEvent(() => {
    onExitStart?.()

    return onExitStart !== undefined
  })
  const handleReady = useEffectEvent(() => {
    onReady?.()
  })
  const { get, loading } = useEditor(
    (root) => {
      const crepe = createCrepe(root, {
        defaultValue,
        placeholder,
        ariaLabel,
        onChange: handleChange,
        onExitStart: handleExitStart,
      })

      crepe.setReadonly(isReadOnly())
      crepeRef.current = crepe

      return crepe
    },
    [defaultValue, placeholder, ariaLabel]
  )

  useEffect(() => {
    if (!loading) handleReady()
  }, [loading])

  useEffect(() => {
    crepeRef.current?.setReadonly(readOnly)
  }, [readOnly])

  useImperativeHandle(ref, () => {
    const withEditor = (run: (editor: Editor) => void) => {
      const editor = get()

      if (!editor) return false

      run(editor)

      return true
    }

    return {
      focus: () => {
        withEditor(editor => editor.ctx.get(editorViewCtx).focus())
      },
      focusStart: () => {
        withEditor(editor => focusStart(editor.ctx.get(editorViewCtx)))
      },
      prependText: text =>
        withEditor((editor) => {
          const view = editor.ctx.get(editorViewCtx)
          const { schema } = view.state

          prepend(
            view,
            Fragment.from(
              schema.node('paragraph', null, text ? schema.text(text) : undefined)
            )
          )
        }),
      prependMarkdown: markdown =>
        withEditor((editor) => {
          prepend(
            editor.ctx.get(editorViewCtx),
            editor.ctx.get(parserCtx)(markdown).content
          )
        }),
    }
  }, [get])

  return (
    <div className={cn('flex min-h-40 flex-col', className)}>
      <Milkdown />
    </div>
  )
}
