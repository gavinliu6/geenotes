import { closeHistory, isHistoryTransaction } from '@milkdown/kit/prose/history'
import type { MarkType, Node } from '@milkdown/kit/prose/model'
import type { EditorState, PluginKey, Transaction } from '@milkdown/kit/prose/state'
import { Plugin } from '@milkdown/kit/prose/state'
import type { Mappable } from '@milkdown/kit/prose/transform'
import { Mapping } from '@milkdown/kit/prose/transform'
import type { EditorProps } from '@milkdown/kit/prose/view'

export interface Span {
  from: number
  to: number
}

interface Syntax<T extends Span> {
  key: PluginKey<T | null>
  /** The spans in the range's textblock that contain the range. */
  around: (doc: Node, range: Span) => T[]
  convert: (tr: Transaction, span: T) => Transaction
  props?: EditorProps
}

export const wordChar = /[\p{L}\p{N}_]/u

const pendingConversions = new WeakMap<Plugin, (tr: Transaction, state: EditorState) => void>()

/** Keeps Markdown syntax edited from the inside as text while the caret touches it, and converts it once the caret leaves. A transaction can also mark a span by setting it as the key's meta. */
export function convertOnLeave<T extends Span>({ key, around, convert, props }: Syntax<T>) {
  const map = (mapping: Mappable, span: T, doc: Node) => {
    const from = mapping.map(span.from, 1)
    const to = mapping.map(span.to, -1)

    if (to - from < 3) return null

    return around(doc, { from: from + 1, to: to - 1 })
      .find(mapped => mapped.from === from && mapped.to === to) ?? null
  }

  const plugin = new Plugin<T | null>({
    key,
    state: {
      init: () => null,
      apply: (tr, pending, _, { doc, selection }) => {
        const marked = tr.getMeta(key) as T | undefined

        if (marked) return marked

        if (tr.docChanged && !isHistoryTransaction(tr)) {
          const edited = around(doc, selection).find(span => isEdited(tr, span))

          if (edited) return edited
        }

        const span = pending && map(tr.mapping, pending, doc)

        return span && (touches(selection, span) || tr.getMeta('composition')) ? span : null
      },
    },
    appendTransaction: (transactions, oldState, state) => {
      if (transactions.some(tr => tr.getMeta('composition'))) return null

      const pending = key.getState(oldState)
      const mapping = new Mapping(transactions.flatMap(tr => tr.mapping.maps))
      const span = pending && map(mapping, pending, state.doc)

      if (!span || touches(state.selection, span)) return null

      return closeHistory(convert(state.tr, span))
    },
    props: {
      ...props,
      handleDOMEvents: {
        ...props?.handleDOMEvents,
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

  pendingConversions.set(plugin, (tr, state) => {
    const pending = key.getState(state)
    const span = pending && map(tr.mapping, pending, tr.doc)

    if (span) convert(tr, span)
  })

  return plugin
}

/** Converts the syntax still being edited without moving the caret or changing the document being edited, so saves don't depend on where the caret is. */
export function documentWithPendingSyntax(state: EditorState) {
  const { tr } = state

  for (const plugin of state.plugins) pendingConversions.get(plugin)?.(tr, state)

  return tr.doc
}

/** The textblock's text with inline nodes and inline code masked out, since typed syntax can't start or end inside either. */
export function plainText(parent: Node, code: MarkType) {
  if (!parent.isTextblock || parent.type.spec.code) return null

  let text = ''

  parent.forEach((child) => {
    text += child.isText && !code.isInSet(child.marks)
      ? child.textContent
      : '\uFFFC'.repeat(child.nodeSize)
  })

  return text
}

function isEdited(tr: Transaction, span: Span) {
  return tr.mapping.maps.some((map, index) => {
    const rest = tr.mapping.slice(index + 1)
    let edited = false

    map.forEach((_oldFrom, _oldTo, from, to) => {
      edited ||= rest.map(from, -1) < span.to && rest.map(to, 1) > span.from
    })

    return edited
  })
}

function touches(selection: Span, span: Span) {
  return selection.from <= span.to && selection.to >= span.from
}
