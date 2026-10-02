import type { Fragment, Node } from '@milkdown/kit/prose/model'
import type { Transaction } from '@milkdown/kit/prose/state'
import { Selection } from '@milkdown/kit/prose/state'
import type { EditorView } from '@milkdown/kit/prose/view'

/** Inserts `fragment` before everything else, replacing a leading empty paragraph. */
export function prepend(view: EditorView, fragment: Fragment) {
  const { doc, tr } = view.state
  const first = doc.firstChild
  const replacesFirst = first !== null && isEmptyParagraph(first)
  const isNoop
    = replacesFirst
      && fragment.childCount === 1
      && isEmptyParagraph(fragment.child(0))

  if (!isNoop) tr.replaceWith(0, replacesFirst ? first.nodeSize : 0, fragment)

  focusStart(view, tr)
}

export function focusStart(view: EditorView, tr: Transaction = view.state.tr) {
  view.focus()
  view.dispatch(tr.setSelection(Selection.atStart(tr.doc)).scrollIntoView())
}

export function isEmptyParagraph(node: Node) {
  return node.type.name === 'paragraph' && node.content.size === 0
}
