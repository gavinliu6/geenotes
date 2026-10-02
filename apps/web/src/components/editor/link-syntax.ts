import { remarkCtx } from '@milkdown/kit/core'
import { inlineCodeSchema, linkSchema } from '@milkdown/kit/preset/commonmark'
import type { MarkType, Node } from '@milkdown/kit/prose/model'
import type { Transaction } from '@milkdown/kit/prose/state'
import { PluginKey } from '@milkdown/kit/prose/state'
import type { RemarkParser } from '@milkdown/kit/transformer'
import { $prose } from '@milkdown/kit/utils'

import type { Span } from './typed-syntax'
import { convertOnLeave, plainText } from './typed-syntax'

interface LinkSyntax extends Span {
  /** The position of the bracket that closes the link text. */
  textEnd: number
  href: string
  title: string | null
}

const key = new PluginKey<LinkSyntax | null>('linkSyntax')

/** Turns `[text](url)` typed as text into a link once the caret stops touching it, as long as the brackets hold some text. */
export const linkSyntax = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)
  const link = linkSchema.type(ctx)
  const remark = ctx.get(remarkCtx)

  return convertOnLeave({
    key,
    around: (doc, range) => linksAround(doc, range, code, remark),
    convert: (tr, syntax) => convertLink(tr, syntax, link),
  })
})

function convertLink(tr: Transaction, { from, to, textEnd, href, title }: LinkSyntax, link: MarkType) {
  return tr
    .delete(textEnd, to)
    .delete(from, from + 1)
    .addMark(from, textEnd - 1, link.create({ href, title }))
}

function linksAround(doc: Node, { from, to }: Span, code: MarkType, remark: RemarkParser) {
  const $from = doc.resolve(from)
  const text = plainText($from.parent, code)
  const start = $from.start()

  if (text === null || to > $from.end()) return []

  return linksOf(text, remark)
    .map(link => ({ ...link, from: start + link.from, to: start + link.to, textEnd: start + link.textEnd }))
    .filter(link => link.from <= from && to <= link.to)
}

/** Reads each link the way the Markdown parser does, starting at its `[` so the text before it can't change the outcome. Inline code and inline nodes may sit in the link text, but not in the destination. */
function linksOf(text: string, remark: RemarkParser) {
  const links: LinkSyntax[] = []

  for (const { index: textEnd } of text.matchAll(/\]\(/g)) {
    const from = openingBracket(text, textEnd)

    if (from === -1 || text[from - 1] === '!' || !text.slice(from + 1, textEnd).trim()) continue

    const link = leadingLink(text.slice(from), remark)

    if (!link || from + link.textEnd !== textEnd) continue

    const to = from + link.end

    if (!text.slice(textEnd, to).includes('\uFFFC')) links.push({ from, to, textEnd, href: link.href, title: link.title })
  }

  return links
}

/** The `[` that the `]` at the index closes, skipping nested pairs. */
function openingBracket(text: string, close: number) {
  let depth = 0

  for (let index = close - 1; index >= 0; index--) {
    if (text[index] === ']') depth++
    else if (text[index] === '[' && --depth < 0) return index
  }

  return -1
}

/** The link the Markdown starts with, with offsets into the Markdown. */
function leadingLink(markdown: string, remark: RemarkParser) {
  const paragraph = remark.parse(markdown).children.at(0)
  const link = paragraph?.type === 'paragraph' ? paragraph.children.at(0) : undefined

  if (link?.type !== 'link') return null

  const end = link.position?.end.offset
  const textEnd = link.children.at(-1)?.position?.end.offset

  return end === undefined || textEnd === undefined
    ? null
    : { end, textEnd, href: link.url, title: link.title ?? null }
}
