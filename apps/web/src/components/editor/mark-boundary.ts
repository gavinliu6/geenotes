import { editorViewOptionsCtx } from '@milkdown/kit/core'
import { inlineCodeSchema, linkSchema } from '@milkdown/kit/preset/commonmark'
import type { Node, ResolvedPos } from '@milkdown/kit/prose/model'
import { Mark } from '@milkdown/kit/prose/model'
import type { EditorState } from '@milkdown/kit/prose/state'
import { Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state'
import type { EditorView } from '@milkdown/kit/prose/view'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $prose } from '@milkdown/kit/utils'

import { emailSchema } from './email'
import type { EmailLinkChange } from './email-link'
import { emailLinkChanges } from './email-link'

interface Edge {
  pos: number
  /** The inline code, link or email that starts or ends here. */
  mark: Mark
  /** Whether the mark ends here rather than starts. */
  end: boolean
  /** Whether the caret can also stop on the mark's side of the edge. */
  enterable: boolean
  inside: readonly Mark[]
  outside: readonly Mark[]
}

const key = new PluginKey('markBoundary')
const segmenter = new Intl.Segmenter()

/** Milkdown makes inline code non-inclusive, so being inside its end takes stored marks, and ProseMirror then restarts an IME composition in a wrapper that merges into the code text and breaks it. */
const inclusiveInlineCode = inlineCodeSchema.extendSchema(prev => ctx => ({ ...prev(ctx), inclusive: true }))

/** Gives each edge of inline code, and the end of each link or email, a caret stop inside the mark and one outside it, which the arrow keys step through. The caret can leave a mark that ends a paragraph without leaving the paragraph, and text typed after escaping stays out of it. */
const markEdges = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)
  const link = linkSchema.type(ctx)
  const email = emailSchema.type(ctx)
  let editor: EditorView | null = null
  let pointerX: number | null = null
  let pointerY: number | null = null
  let pointerDown = false
  let pointerMoved = false
  let pointerTimer: ReturnType<typeof setTimeout> | undefined

  const codeEdgeAt = ($pos: ResolvedPos, before: Node | null, after: Node | null): Edge | null => {
    const codeBefore = !!before && !!code.isInSet(before.marks)
    const codeAfter = !!after && !!code.isInSet(after.marks)
    const inner = codeBefore ? before : after
    const mark = inner && code.isInSet(inner.marks)

    if (codeBefore === codeAfter || !inner || !mark) return null

    const outer = codeBefore ? after : before

    return {
      pos: $pos.pos,
      mark,
      end: codeBefore,
      enterable: true,
      inside: inner.marks,
      outside: $pos.marks().filter(other =>
        other.type !== code && ((other.type !== link && other.type !== email) || other.isInSet(outer?.marks ?? []))),
    }
  }

  /** A link or email's start only needs a stop when it opens its paragraph, where the caret would otherwise inherit the mark; after text it doesn't. */
  const linkEdgeAt = ($pos: ResolvedPos, before: Node | null, after: Node | null): Edge | null => {
    const outside = $pos.marks().filter(other => other.type !== link && other.type !== email)

    if (before) {
      const mark = link.isInSet(before.marks) ?? email.isInSet(before.marks)

      return mark && !mark.isInSet(after?.marks ?? [])
        ? { pos: $pos.pos, mark, end: true, enterable: true, inside: before.marks, outside }
        : null
    }

    const mark = after && (link.isInSet(after.marks) ?? email.isInSet(after.marks))

    return mark ? { pos: $pos.pos, mark, end: false, enterable: false, inside: after.marks, outside } : null
  }

  const edgeAt = ($pos: ResolvedPos): Edge | null => {
    const { parent, nodeBefore: before, nodeAfter: after } = $pos

    if (!parent.isTextblock || parent.type.spec.code || $pos.textOffset) return null

    return codeEdgeAt($pos, before, after) ?? linkEdgeAt($pos, before, after)
  }

  const edgeOf = ({ selection }: EditorState) =>
    selection instanceof TextSelection && selection.empty ? edgeAt(selection.$head) : null

  const isInside = ({ storedMarks, selection }: EditorState, edge: Edge) =>
    !!edge.mark.isInSet(storedMarks ?? selection.$head.marks())

  /** Stored marks only where they differ from the position's own marks, plus inside a code start, where the composition has to restart inside the code. */
  const storedFor = ($pos: ResolvedPos, edge: Edge, inside: boolean) => {
    const marks = inside ? edge.inside : edge.outside

    return (inside && !edge.end) || !Mark.sameSet($pos.marks(), marks) ? marks : null
  }

  /** ProseMirror carries the marks of deleted text over to the next input, which would bring back code, a link or an email that was deleted in full. */
  const withoutDeletedMarks = ({ storedMarks, selection: { $head }, tr }: EditorState) => {
    const touching = [...$head.nodeBefore?.marks ?? [], ...$head.nodeAfter?.marks ?? []]
    const kept = storedMarks?.filter(({ type }) => (type !== code && type !== link && type !== email) || type.isInSet(touching))

    if (!kept || kept.length === storedMarks?.length) return null

    return tr.setStoredMarks(Mark.sameSet(kept, $head.marks()) ? null : kept).setMeta(key, true)
  }

  const withSide = (state: EditorState, edge: Edge, inside: boolean) => {
    const stored = storedFor(state.selection.$head, edge, inside)
    const current = state.storedMarks

    if (stored === current || (stored && current && Mark.sameSet(stored, current))) return null

    return state.tr.setStoredMarks(stored).setMeta(key, true)
  }

  /** Clicks on code glyphs land inside the code; clicks at a link or email's end land outside its mark. */
  const clickedInside = (edge: Edge) =>
    edge.mark.type === code && !!editor && pointerX !== null && insideAt(editor, edge, pointerX)

  return new Plugin({
    key,
    appendTransaction: (transactions, oldState, state) => {
      if (transactions.some(tr => tr.getMeta(key))) return null

      const edge = edgeOf(state)
      const edited = transactions.some(tr => tr.docChanged)

      if (pointerDown && !edited) return null
      if (!edge) return edited ? withoutDeletedMarks(state) : null
      if (!edge.enterable) return isInside(state, edge) ? withSide(state, edge, false) : null
      if (edited) {
        const changes: EmailLinkChange[] = transactions.flatMap(tr => tr.getMeta(emailLinkChanges) ?? [])
        const renamed = changes.find(change => change.next?.eq(edge.mark)
          && (edge.end ? change.to : change.from) === edge.pos)
        const previous = renamed ? { ...edge, mark: renamed.previous } : edge
        // Range edits inherit transaction marks; their head depends on selection direction.
        return oldState.selection instanceof TextSelection && oldState.selection.empty
          ? withSide(state, edge, isInside(oldState, previous))
          : null
      }
      if (!transactions.some(tr => tr.selectionSet)) return null

      return withSide(state, edge, transactions.some(tr => tr.getMeta('pointer')) && clickedInside(edge))
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

        if (edge?.enterable) {
          const inside = isInside(state, edge)

          if (inside === (edge.end === forward)) {
            const tr = withSide(state, edge, !inside)

            if (tr) view.dispatch(tr)

            return true
          }
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
            .setStoredMarks(storedFor($target, arrival, arrival.enterable && !!arrival.mark.isInSet(crossed.marks)))
            .setMeta(key, true)
            .scrollIntoView()
        )

        return true
      },
      decorations: (state) => {
        const editable = editor?.editable ?? ctx.get(editorViewOptionsCtx).editable?.(state) ?? true

        if (!editable || pointerDown) return null

        const nativeSelection = editor?.dom.ownerDocument.getSelection()

        if (nativeSelection?.rangeCount && !nativeSelection.isCollapsed) return null

        const edge = edgeOf(state)
        const inside = !!edge && isInside(state, edge)

        if (!edge || (edge.end && inside)) return null

        const side = edge.end || inside ? -1 : 1
        const { nodeBefore, nodeAfter } = state.selection.$head
        // Chrome draws no caret after the last child of a mark's element, so the anchor only joins marks that continue past the caret.
        const marks = edge.outside.filter(mark => mark.isInSet(nodeAfter?.marks ?? []))
        // Next to text, an empty anchor is enough, and a character in it would break the autospace between the characters around it.
        const text = (edge.end ? nodeAfter : nodeBefore)?.isText ? '' : '\u2060'

        return DecorationSet.create(state.doc, [
          Decoration.widget(edge.pos, () => document.createTextNode(text), {
            side,
            marks,
            key: `mark-edge${side}${text ? '' : '-empty'}`,
          }),
        ])
      },
    },
    view: (view) => {
      editor = view

      const onPointerDown = (event: PointerEvent) => {
        pointerX = view.editable ? event.clientX : null

        if (!view.editable || event.button !== 0) return

        clearTimeout(pointerTimer)
        pointerY = event.clientY
        pointerDown = true
        pointerMoved = false
        // Remove the caret widget before native selection starts; changing it during a drag collapses the range.
        view.dispatch(view.state.tr.setMeta(key, true))
      }

      const onPointerMove = (event: PointerEvent) => {
        if (!pointerDown || pointerX === null || pointerY === null) return

        if (Math.abs(event.clientX - pointerX) > 4 || Math.abs(event.clientY - pointerY) > 4) pointerMoved = true
      }

      const onPointerEnd = () => {
        if (!pointerDown) return

        clearTimeout(pointerTimer)
        pointerTimer = setTimeout(() => {
          pointerDown = false

          if (!view.isDestroyed) view.dispatch(view.state.tr.setMeta(key, true))
        })
      }

      const onClick = () => {
        setTimeout(() => {
          if (!view.editable || view.isDestroyed || pointerDown || pointerMoved) return
          // Native ranges can appear before ProseMirror updates its selection.
          if (!view.dom.ownerDocument.getSelection()?.isCollapsed) return

          const edge = edgeOf(view.state)

          if (!edge || pointerX === null) return

          const tr = withSide(view.state, edge, clickedInside(edge))

          if (tr) view.dispatch(tr)
          else syncCaret(view, edge)
        })
      }

      view.dom.addEventListener('pointerdown', onPointerDown, true)
      view.dom.addEventListener('click', onClick)
      view.dom.ownerDocument.addEventListener('pointermove', onPointerMove, true)
      view.dom.ownerDocument.addEventListener('pointerup', onPointerEnd, true)
      view.dom.ownerDocument.addEventListener('pointercancel', onPointerEnd, true)

      return {
        destroy: () => {
          editor = null
          clearTimeout(pointerTimer)
          view.dom.removeEventListener('pointerdown', onPointerDown, true)
          view.dom.removeEventListener('click', onClick)
          view.dom.ownerDocument.removeEventListener('pointermove', onPointerMove, true)
          view.dom.ownerDocument.removeEventListener('pointerup', onPointerEnd, true)
          view.dom.ownerDocument.removeEventListener('pointercancel', onPointerEnd, true)
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

export const markBoundary = [inclusiveInlineCode, markEdges].flat()
