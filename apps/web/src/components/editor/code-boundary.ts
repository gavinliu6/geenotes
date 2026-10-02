import { inlineCodeSchema, linkSchema } from '@milkdown/kit/preset/commonmark'
import type { ResolvedPos } from '@milkdown/kit/prose/model'
import { Mark } from '@milkdown/kit/prose/model'
import type { EditorState } from '@milkdown/kit/prose/state'
import { Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state'
import type { EditorView } from '@milkdown/kit/prose/view'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $prose } from '@milkdown/kit/utils'

interface Edge {
  pos: number
  /** Whether the code ends here rather than starts. */
  end: boolean
  inside: readonly Mark[]
  outside: readonly Mark[]
}

const key = new PluginKey('codeBoundary')
const segmenter = new Intl.Segmenter()

/** Milkdown makes inline code non-inclusive, so being inside its end takes stored marks, and ProseMirror then restarts an IME composition in a wrapper that merges into the code text and breaks it. */
const inclusiveInlineCode = inlineCodeSchema.extendSchema(prev => ctx => ({ ...prev(ctx), inclusive: true }))

/** Gives each edge of inline code a caret stop inside and one outside the code, which the arrow keys step through, so the caret can leave code that ends a paragraph without leaving the paragraph. */
const codeEdges = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)
  const link = linkSchema.type(ctx)
  let editor: EditorView | null = null
  let pointerX: number | null = null

  const edgeAt = ($pos: ResolvedPos): Edge | null => {
    const { parent, nodeBefore: before, nodeAfter: after } = $pos

    if (!parent.isTextblock || parent.type.spec.code || $pos.textOffset) return null

    const codeBefore = !!before && !!code.isInSet(before.marks)
    const codeAfter = !!after && !!code.isInSet(after.marks)
    const inner = codeBefore ? before : after

    if (codeBefore === codeAfter || !inner) return null

    const outer = codeBefore ? after : before

    return {
      pos: $pos.pos,
      end: codeBefore,
      inside: inner.marks,
      outside: $pos.marks().filter(mark =>
        mark.type !== code && (mark.type !== link || mark.isInSet(outer?.marks ?? []))),
    }
  }

  const edgeOf = ({ selection }: EditorState) =>
    selection instanceof TextSelection && selection.empty ? edgeAt(selection.$head) : null

  const isInside = (state: EditorState) =>
    !!code.isInSet(state.storedMarks ?? state.selection.$head.marks())

  /** Stored marks only where they differ from the position's own marks, plus inside a code start, where the composition has to restart inside the code. */
  const storedFor = ($pos: ResolvedPos, edge: Edge, inside: boolean) => {
    const marks = inside ? edge.inside : edge.outside

    return (inside && !edge.end) || !Mark.sameSet($pos.marks(), marks) ? marks : null
  }

  /** ProseMirror carries the marks of deleted text over to the next input, which would bring back code that was deleted in full. */
  const withoutDeletedCode = ({ storedMarks, selection, tr }: EditorState) => {
    const marks = selection.$head.marks()

    if (!storedMarks || !code.isInSet(storedMarks) || code.isInSet(marks)) return null

    const kept = code.removeFromSet(storedMarks)

    return tr.setStoredMarks(Mark.sameSet(kept, marks) ? null : kept).setMeta(key, true)
  }

  const withSide = (state: EditorState, edge: Edge, inside: boolean) => {
    const stored = storedFor(state.selection.$head, edge, inside)
    const current = state.storedMarks

    if (stored === current || (stored && current && Mark.sameSet(stored, current))) return null

    return state.tr.setStoredMarks(stored).setMeta(key, true)
  }

  return new Plugin({
    key,
    appendTransaction: (transactions, oldState, state) => {
      if (transactions.some(tr => tr.getMeta(key))) return null

      const edge = edgeOf(state)
      const edited = transactions.some(tr => tr.docChanged)

      if (!edge) return edited ? withoutDeletedCode(state) : null
      if (edited) {
        // Range edits inherit transaction marks; their head depends on selection direction.
        return oldState.selection instanceof TextSelection && oldState.selection.empty
          ? withSide(state, edge, isInside(oldState))
          : null
      }
      if (!transactions.some(tr => tr.selectionSet)) return null

      const clicked = transactions.some(tr => tr.getMeta('pointer'))

      return withSide(state, edge, clicked && !!editor && pointerX !== null && insideAt(editor, edge, pointerX))
    },
    props: {
      handleKeyDown: (view, event) => {
        const forward = event.key === 'ArrowRight'
        const { state } = view
        const { selection } = state

        if (!forward && event.key !== 'ArrowLeft') return false
        if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || view.composing) return false
        if (!(selection instanceof TextSelection) || !selection.empty) return false

        const edge = edgeAt(selection.$head)
        const inside = isInside(state)

        if (edge && inside === (edge.end === forward)) {
          const tr = withSide(state, edge, !inside)

          if (tr) view.dispatch(tr)

          return true
        }

        const crossed = forward ? selection.$head.nodeAfter : selection.$head.nodeBefore

        if (!crossed) return false

        const size = crossed.isText ? grapheme(crossed.textContent, forward).length : crossed.nodeSize
        const $target = state.doc.resolve(selection.head + (forward ? size : -size))
        const arrival = edgeAt($target)

        if (!arrival) return false

        view.dispatch(
          state.tr
            .setSelection(TextSelection.create(state.doc, $target.pos))
            .setStoredMarks(storedFor($target, arrival, !!code.isInSet(crossed.marks)))
            .setMeta(key, true)
            .scrollIntoView()
        )

        return true
      },
      decorations: (state) => {
        const edge = edgeOf(state)
        const inside = isInside(state)

        if (!edge || (edge.end && inside)) return null

        const side = edge.end || inside ? -1 : 1

        return DecorationSet.create(state.doc, [
          Decoration.widget(edge.pos, () => document.createTextNode('\u2060'), {
            side,
            marks: edge.outside,
            key: `code-edge${side}`,
          }),
        ])
      },
    },
    view: (view) => {
      editor = view

      const onPointerDown = (event: PointerEvent) => {
        pointerX = event.clientX
      }

      const onClick = () => {
        setTimeout(() => {
          const edge = edgeOf(view.state)

          if (!edge || pointerX === null || view.isDestroyed) return

          const tr = withSide(view.state, edge, insideAt(view, edge, pointerX))

          if (tr) view.dispatch(tr)
          else syncCaret(view, edge)
        })
      }

      view.dom.addEventListener('pointerdown', onPointerDown, true)
      view.dom.addEventListener('click', onClick)

      return {
        destroy: () => {
          editor = null
          view.dom.removeEventListener('pointerdown', onPointerDown, true)
          view.dom.removeEventListener('click', onClick)
        },
      }
    },
  })
})

function grapheme(text: string, forward: boolean) {
  return segmenter.segment(text).containing(forward ? 0 : text.length - 1)?.segment ?? text
}

/** Clicks on the code's glyphs land inside it; clicks on its padding or past it land outside. */
function insideAt(view: EditorView, edge: Edge, x: number) {
  const { node } = view.domAtPos(edge.end ? edge.pos - 1 : edge.pos + 1)

  if (!(node instanceof Text)) return false

  const range = document.createRange()

  range.selectNodeContents(node)

  const rects = range.getClientRects()
  const rect = rects.item(edge.end ? rects.length - 1 : 0)

  return !!rect && (edge.end ? x <= rect.right : x >= rect.left)
}

/** The browser keeps a clicked caret where it put it when the position doesn't change, which may be the other side of the edge. */
function syncCaret(view: EditorView, edge: Edge) {
  const { node, offset } = view.domAtPos(edge.pos, -1)
  const selection = view.dom.ownerDocument.getSelection()

  if (selection && (selection.focusNode !== node || selection.focusOffset !== offset)) {
    selection.collapse(node, offset)
  }
}

export const codeBoundary = [inclusiveInlineCode, codeEdges].flat()
