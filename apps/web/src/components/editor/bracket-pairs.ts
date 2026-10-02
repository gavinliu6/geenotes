import { inlineCodeSchema } from '@milkdown/kit/preset/commonmark'
import { keydownHandler } from '@milkdown/kit/prose/keymap'
import type { MarkType } from '@milkdown/kit/prose/model'
import type { Command } from '@milkdown/kit/prose/state'
import { Plugin, TextSelection } from '@milkdown/kit/prose/state'
import type { EditorView } from '@milkdown/kit/prose/view'
import { $prose } from '@milkdown/kit/utils'

import { plainText, wordChar } from './typed-syntax'

const pairs = ['()', '[]', '{}']

/** Types brackets in pairs: an opening bracket adds its closing one after the caret or wraps the selection, a closing bracket steps over one that closes an open pair, and Backspace removes an empty pair. */
export const bracketPairs = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)

  return new Plugin({
    props: {
      handleTextInput: (view, from, to, text) => !view.composing && typeBracket(view, from, to, text, code),
      handleKeyDown: keydownHandler({ Backspace: deleteEmptyPair(code) }),
    },
  })
})

function typeBracket(view: EditorView, from: number, to: number, typed: string, code: MarkType) {
  const pair = pairs.find(([open, close]) => typed === open || typed === close)

  if (!pair) return false

  const { state } = view
  const $from = state.doc.resolve(from)
  const text = plainText($from.parent, code)

  if (text === null || to > $from.end() || code.isInSet(state.storedMarks ?? $from.marks())) return false

  const [open, close] = pair
  const offset = $from.parentOffset
  const next = text.charAt(offset)
  const { tr } = state

  if (typed === close) {
    if (from < to || next !== close || !hasUnclosed(text.slice(0, offset), open, close)) return false

    view.dispatch(tr.setSelection(TextSelection.create(tr.doc, from + 1)).scrollIntoView())
    runInputRules(view)

    return true
  }

  if (from < to) {
    if (text.slice(offset, offset + to - from).includes('\uFFFC')) return false

    tr.insertText(close, to).insertText(open, from)
    tr.setSelection(TextSelection.create(tr.doc, from + 1, to + 1))
  } else if (wordChar.test(next)) {
    return false
  } else {
    tr.insertText(pair, from)
    tr.setSelection(TextSelection.create(tr.doc, from + 1))
  }

  view.dispatch(tr.scrollIntoView())

  return true
}

function deleteEmptyPair(code: MarkType): Command {
  return (state, dispatch) => {
    const $cursor = state.selection instanceof TextSelection ? state.selection.$cursor : null
    const text = $cursor && plainText($cursor.parent, code)
    const offset = $cursor?.parentOffset

    if (!$cursor || !text || !offset || !pairs.includes(text.slice(offset - 1, offset + 1))) return false

    dispatch?.(state.tr.delete($cursor.pos - 1, $cursor.pos + 1).scrollIntoView())

    return true
  }
}

function hasUnclosed(text: string, open: string, close: string) {
  let depth = 0

  for (const char of text) {
    if (char === open) depth++
    else if (char === close && depth > 0) depth--
  }

  return depth > 0
}

/** Lets input rules see a closing bracket that was stepped over as typed, so `[!NOTE]` still turns a quote into an alert. */
function runInputRules(view: EditorView) {
  const { head } = view.state.selection

  view.someProp('handleTextInput', handle => handle(view, head, head, '', () => view.state.tr))
}
