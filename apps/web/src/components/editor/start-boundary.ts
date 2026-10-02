import { keymap } from '@milkdown/kit/prose/keymap'
import type { EditorState } from '@milkdown/kit/prose/state'
import { Selection } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

import { isEmptyParagraph } from './commands'

/** Lets the caret leave the top of the document; `onExit` reports whether something took the focus. */
export function startBoundary(onExit: () => boolean) {
  return $prose(() =>
    keymap({
      ArrowUp: (state, _, view) =>
        (isAtStart(state)
          || (isInFirstTextblock(state) && !!view?.endOfTextblock('up')))
        && onExit(),
      ArrowLeft: state => isAtStart(state) && onExit(),
      Backspace: (state, dispatch) => {
        const first = state.doc.firstChild

        if (!isAtStart(state) || first?.type.name !== 'paragraph') return false
        if (!onExit()) return false

        if (isEmptyParagraph(first) && state.doc.childCount > 1) {
          dispatch?.(state.tr.delete(0, first.nodeSize))
        }

        return true
      },
    })
  )
}

function isAtStart(state: EditorState) {
  return (
    state.selection.empty
    && state.selection.from <= Selection.atStart(state.doc).from
  )
}

function isInFirstTextblock(state: EditorState) {
  return (
    state.selection.$from.start()
    === Selection.atStart(state.doc).$from.start()
  )
}
