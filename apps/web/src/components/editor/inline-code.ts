import { InitReady, marksCtx, schemaTimerCtx } from '@milkdown/kit/core'
import { inlineCodeSchema, linkSchema } from '@milkdown/kit/preset/commonmark'
import { keydownHandler } from '@milkdown/kit/prose/keymap'
import type { MarkType, Node } from '@milkdown/kit/prose/model'
import type { Command, Transaction } from '@milkdown/kit/prose/state'
import { Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state'
import type { EditorView } from '@milkdown/kit/prose/view'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $prose, addTimer } from '@milkdown/kit/utils'

import type { Span } from './typed-syntax'
import { convertOnLeave, plainText, wordChar } from './typed-syntax'

const key = new PluginKey<Span | null>('backtickPairs')
const linkTailsKey = new PluginKey<DecorationSet>('codeLinkTails')

/** Registers inline code as the last mark so it renders innermost: a Markdown code span can't hold other inline content, and an outer code mark splits a link around it into separate anchors. */
export const innermostInlineCode = addTimer(async (ctx) => {
  await ctx.wait(InitReady)

  ctx.update(marksCtx, marks => [
    ...marks.filter(([id]) => id !== 'inlineCode'),
    ...marks.filter(([id]) => id === 'inlineCode'),
  ])
}, schemaTimerCtx)

/** Wraps the end of a link that contains inline code, so the external link arrow can follow the text inside the code; a flex anchor would turn the code into a taller block. */
export const codeLinkTails = $prose((ctx) => {
  const link = linkSchema.type(ctx)
  const code = inlineCodeSchema.type(ctx)

  return new Plugin<DecorationSet>({
    key: linkTailsKey,
    state: {
      init: (_, { doc }) => decorateLinkTails(doc, link, code),
      apply: (tr, set) => (tr.docChanged ? decorateLinkTails(tr.doc, link, code) : set),
    },
    props: {
      decorations: state => linkTailsKey.getState(state),
    },
  })
})

/** Types backticks the way Obsidian does: a backtick opens a pair, the closing one is typed over, and a pair edited from the inside becomes inline code once the caret stops touching it. */
export const backtickPairs = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)

  return convertOnLeave({
    key,
    around: (doc, range) => pairsAround(doc, range, code),
    convert: (tr, pair) => convertPair(tr, pair, code),
    props: {
      handleTextInput: (view, from, to, text) =>
        text === '`' && !view.composing && typeBacktick(view, from, to, code),
      handleKeyDown: keydownHandler({ Backspace: deleteEmptyPair(code) }),
    },
  })
})

function convertPair(tr: Transaction, pair: Span, code: MarkType) {
  return tr
    .delete(pair.to - 1, pair.to)
    .delete(pair.from, pair.from + 1)
    .addMark(pair.from, pair.to - 2, code.create())
}

function decorateLinkTails(doc: Node, link: MarkType, code: MarkType) {
  const decorations: Decoration[] = []

  doc.descendants((node, pos, parent, index) => {
    const mark = link.isInSet(node.marks)

    if (!node.isText || !mark || !parent || mark.isInSet(parent.maybeChild(index + 1)?.marks ?? [])) return

    for (let i = index; i >= 0 && mark.isInSet(parent.child(i).marks); i--) {
      if (code.isInSet(parent.child(i).marks)) {
        decorations.push(Decoration.inline(pos, pos + node.nodeSize, { class: 'link-tail' }))

        return
      }
    }
  })

  return DecorationSet.create(doc, decorations)
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
