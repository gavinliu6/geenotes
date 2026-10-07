import { remarkCtx } from '@milkdown/kit/core'
import { emphasisSchema, inlineCodeSchema, strongSchema } from '@milkdown/kit/preset/commonmark'
import { strikethroughSchema } from '@milkdown/kit/preset/gfm'
import type { Mark, Node } from '@milkdown/kit/prose/model'
import type { Transaction } from '@milkdown/kit/prose/state'
import { PluginKey } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

import type { Span } from './typed-syntax'
import { convertOnLeave, plainText } from './typed-syntax'

interface DelimitedMark extends Span {
  mark: Mark
  width: number
}

interface EmphasisSyntax extends Span {
  marks: DelimitedMark[]
}

interface SyntaxNode {
  type: string
  position?: { start: { offset?: number }, end: { offset?: number } }
  children?: SyntaxNode[]
}

const key = new PluginKey<EmphasisSyntax | null>('emphasisSyntax')

/** Converts typed bold, italic and strikethrough once the caret leaves, using the note's Markdown dialect and preserving nested marks and inline code. */
export const emphasisSyntax = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)
  const remark = ctx.get(remarkCtx)
  const types = new Map([
    ['strong', strongSchema.type(ctx)],
    ['emphasis', emphasisSchema.type(ctx)],
    ['delete', strikethroughSchema.type(ctx)],
  ])
  const cache = new WeakMap<Node, EmphasisSyntax[]>()

  const syntaxIn = (parent: Node) => {
    const cached = cache.get(parent)

    if (cached) return cached

    const text = plainText(parent, code)
    const spans: EmphasisSyntax[] = []

    if (text !== null && /[*_~]/.test(text)) {
      const visit = (node: SyntaxNode, outer?: EmphasisSyntax) => {
        const type = types.get(node.type)
        const start = node.position?.start.offset
        const end = node.position?.end.offset

        if (type && start !== undefined && end !== undefined) {
          const from = start - 2
          const to = end - 2
          const width = node.type === 'strong' || text.startsWith('~~', from) ? 2 : 1
          const mark = type.create(node.type === 'delete' ? null : { marker: text[from] })
          const span = outer ?? { from, to, marks: [] }

          span.marks.push({ from, to, mark, width })
          if (!outer) spans.push(span)
          node.children?.forEach(child => visit(child, span))
        } else {
          node.children?.forEach(child => visit(child, outer))
        }
      }

      // This is already a textblock; keep indentation, HTML and definitions from becoming Markdown blocks.
      visit(remark.parse(`x ${text}`))
    }

    cache.set(parent, spans)

    return spans
  }

  return convertOnLeave({
    key,
    around: (doc, { from, to }) => {
      const $from = doc.resolve(from)
      const start = $from.start()

      if (to > $from.end()) return []

      return syntaxIn($from.parent)
        .filter(span => start + span.from <= from && to <= start + span.to)
        .map(span => ({
          from: start + span.from,
          to: start + span.to,
          marks: span.marks.map(mark => ({ ...mark, from: start + mark.from, to: start + mark.to })),
        }))
    },
    convert: convertEmphasis,
  })
})

/** Applies every nested mark together so leaving `***text***` doesn't strand the inner delimiters. */
function convertEmphasis(tr: Transaction, { marks }: EmphasisSyntax) {
  const delimiters: Span[] = []

  for (const { from, to, mark, width } of marks) {
    tr.addMark(from + width, to - width, mark)
    delimiters.push({ from, to: from + width }, { from: to - width, to })
  }

  for (const { from, to } of delimiters.sort((a, b) => b.from - a.from)) tr.delete(from, to)

  return tr
}
