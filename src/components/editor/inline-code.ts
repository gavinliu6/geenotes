import { inlineCodeSchema } from '@milkdown/kit/preset/commonmark'
import { closeHistory, isHistoryTransaction } from '@milkdown/kit/prose/history'
import { keydownHandler } from '@milkdown/kit/prose/keymap'
import type { MarkType, Node } from '@milkdown/kit/prose/model'
import type { Command, EditorState, Transaction } from '@milkdown/kit/prose/state'
import { Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state'
import type { Mappable } from '@milkdown/kit/prose/transform'
import { Mapping } from '@milkdown/kit/prose/transform'
import type { EditorView } from '@milkdown/kit/prose/view'
import { $prose } from '@milkdown/kit/utils'

interface Span {
  from: number
  to: number
}

const key = new PluginKey<Span | null>('backtickPairs')
const wordChar = /[\p{L}\p{N}_]/u

/** Types backticks the way Obsidian does: a backtick opens a pair, the closing one is typed over, and a pair edited from the inside becomes inline code once the caret stops touching it. */
export const backtickPairs = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)

  return new Plugin<Span | null>({
    key,
    state: {
      init: () => null,
      apply: (tr, pending, _, { doc, selection }) => {
        const typedOver = tr.getMeta(key) as Span | undefined

        if (typedOver) return typedOver

        if (tr.docChanged && !isHistoryTransaction(tr)) {
          const edited = pairsAround(doc, selection, code).find(pair => isEdited(tr, pair))

          if (edited) return edited
        }

        const pair = pending && mapPair(tr.mapping, pending, doc, code)

        return pair && (touches(selection, pair) || tr.getMeta('composition')) ? pair : null
      },
    },
    appendTransaction: (transactions, oldState, state) => {
      if (transactions.some(tr => tr.getMeta('composition'))) return null

      const pending = key.getState(oldState)
      const mapping = new Mapping(transactions.flatMap(tr => tr.mapping.maps))
      const pair = pending && mapPair(mapping, pending, state.doc, code)

      if (!pair || touches(state.selection, pair)) return null

      return closeHistory(convertPair(state.tr, pair, code))
    },
    props: {
      handleTextInput: (view, from, to, text) =>
        text === '`' && !view.composing && typeBacktick(view, from, to, code),
      handleKeyDown: keydownHandler({ Backspace: deleteEmptyPair(code) }),
      handleDOMEvents: {
        compositionend: (view) => {
          setTimeout(() => {
            if (view.isDestroyed || view.composing) return

            const pending = key.getState(view.state)

            if (pending && !touches(view.state.selection, pending)) view.dispatch(view.state.tr)
          })

          return false
        },
      },
    },
  })
})

/** Saves pending pairs as code without moving the caret or changing the document being edited. */
export function documentWithPendingInlineCode(state: EditorState) {
  const pair = key.getState(state)

  return pair ? convertPair(state.tr, pair, state.schema.marks.inlineCode).doc : state.doc
}

function convertPair(tr: Transaction, pair: Span, code: MarkType) {
  return tr
    .delete(pair.to - 1, pair.to)
    .delete(pair.from, pair.from + 1)
    .addMark(pair.from, pair.to - 2, code.create())
}

function typeBacktick(view: EditorView, from: number, to: number, code: MarkType) {
  const { state } = view
  const $from = state.doc.resolve(from)
  const text = plainText($from.parent, code)

  if (text === null || to > $from.end() || code.isInSet(state.storedMarks ?? $from.marks())) {
    return false
  }

  const offset = $from.parentOffset
  const before = text.slice(0, offset)
  const next = text.charAt(offset)
  const { tr } = state

  if (from < to) {
    if (/[`\uFFFC]/.test(text.slice(offset, offset + to - from))) return false

    tr.insertText('`', to).insertText('`', from)
    tr.setSelection(TextSelection.create(tr.doc, from + 1, to + 1))
  } else if (next === '`') {
    const closed = pairsOf(text).find(pair => pair.to - 1 === offset)

    if (!closed) return false

    tr.setSelection(TextSelection.create(tr.doc, from + 1))

    if (!closed.empty) tr.setMeta(key, { from: from - offset + closed.from, to: from - offset + closed.to })
  } else if (before.endsWith('``') || wordChar.test(next) || hasUnclosedBacktick(before)) {
    return false
  } else {
    tr.insertText('``', from)
    tr.setSelection(TextSelection.create(tr.doc, from + 1))
  }

  view.dispatch(tr.scrollIntoView())

  return true
}

function deleteEmptyPair(code: MarkType): Command {
  return (state, dispatch) => {
    const $cursor = state.selection instanceof TextSelection ? state.selection.$cursor : null
    const text = $cursor && plainText($cursor.parent, code)

    if (!$cursor || !text) return false

    const offset = $cursor.parentOffset

    if (!pairsOf(text).some(pair => pair.from === offset - 1 && pair.to === offset + 1)) return false

    dispatch?.(state.tr.delete($cursor.pos - 1, $cursor.pos + 1).scrollIntoView())

    return true
  }
}

/** The textblock's text with inline nodes and inline code masked out, since a pair can't span either. */
function plainText(parent: Node, code: MarkType) {
  if (!parent.isTextblock || parent.type.spec.code) return null

  let text = ''

  parent.forEach((child) => {
    text += child.isText && !code.isInSet(child.marks)
      ? child.textContent
      : '\uFFFC'.repeat(child.nodeSize)
  })

  return text
}

/** Pairs backticks left to right like Markdown. */
function pairsOf(text: string) {
  return Array.from(text.matchAll(/`([^`\uFFFC]*)`/g), match => ({
    from: match.index,
    to: match.index + match[0].length,
    empty: !match[1].trim(),
  }))
}

function hasUnclosedBacktick(before: string) {
  const run = before.slice(before.lastIndexOf('\uFFFC') + 1)

  return (run.match(/`/g)?.length ?? 0) % 2 === 1
}

function pairsAround(doc: Node, { from, to }: Span, code: MarkType): Span[] {
  const $from = doc.resolve(from)
  const text = plainText($from.parent, code)
  const start = $from.start()

  if (text === null || to > $from.end()) return []

  return pairsOf(text)
    .filter(pair => !pair.empty && start + pair.from <= from && to <= start + pair.to)
    .map(pair => ({ from: start + pair.from, to: start + pair.to }))
}

function mapPair(mapping: Mappable, pair: Span, doc: Node, code: MarkType) {
  const from = mapping.map(pair.from, 1)
  const to = mapping.map(pair.to, -1)

  if (to - from < 3) return null

  return pairsAround(doc, { from: from + 1, to: to - 1 }, code)
    .find(mapped => mapped.from === from && mapped.to === to) ?? null
}

function isEdited(tr: Transaction, pair: Span) {
  return tr.mapping.maps.some((map, index) => {
    const rest = tr.mapping.slice(index + 1)
    let edited = false

    map.forEach((_oldFrom, _oldTo, from, to) => {
      edited ||= rest.map(from, -1) < pair.to && rest.map(to, 1) > pair.from
    })

    return edited
  })
}

function touches(selection: Span, pair: Span) {
  return selection.from <= pair.to && selection.to >= pair.from
}
