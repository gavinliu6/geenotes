import { remarkCtx } from '@milkdown/kit/core'
import { inlineCodeSchema, linkSchema } from '@milkdown/kit/preset/commonmark'
import { isHistoryTransaction } from '@milkdown/kit/prose/history'
import type { Mark, MarkType, Node } from '@milkdown/kit/prose/model'
import type { Transaction } from '@milkdown/kit/prose/state'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import type { Mappable } from '@milkdown/kit/prose/transform'
import { AddMarkStep, RemoveMarkStep, ReplaceAroundStep, ReplaceStep } from '@milkdown/kit/prose/transform'
import type { EditorView } from '@milkdown/kit/prose/view'
import type { RemarkParser } from '@milkdown/kit/transformer'
import { $prose } from '@milkdown/kit/utils'

import { emailSchema } from './email'
import type { EmailLinkChange } from './email-link'
import { emailLinkChanges, isAddressLabel } from './email-link'
import type { Span } from './typed-syntax'
import { convertOnLeave, plainText } from './typed-syntax'

interface EmailSyntax extends Span {
  address: string
  bracketed: boolean
}

interface EmailLink extends Span {
  mark: Mark
  text: string
}

interface PendingEmail extends Span {
  mark: Mark
}

interface Textblock {
  text: string
  links: EmailLink[]
  addresses?: Map<string, EmailSyntax[]>
  syntax?: EmailSyntax[]
}

interface MarkdownNode {
  type: string
  url?: string
  children?: MarkdownNode[]
  position?: { start: { offset?: number }, end: { offset?: number } }
}

const key = new PluginKey<EmailSyntax | null>('emailSyntax')
const syncKey = new PluginKey<PendingEmail[]>('emailLinkDestination')
const scanners = new WeakMap<RemarkParser, ReturnType<typeof createScanner>>()

/** Converts typed bare/angle emails after the caret leaves; existing links remain separate when the caret escapes them. */
const typedEmails = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)
  const email = emailSchema.type(ctx)
  const link = linkSchema.type(ctx)
  const scanner = scannerFor(ctx.get(remarkCtx), code, email, link)
  let editor: EditorView | null = null
  const plugin = convertOnLeave({
    key,
    around: scanner.around,
    convert: (tr, syntax) => convertEmail(tr, syntax, email),
  })
  const field = plugin.spec.state!
  const apply = field.apply
  const append = plugin.spec.appendTransaction!

  field.apply = (tr, pending, oldState, state) => {
    const next = apply.call(plugin, tr, pending, oldState, state)

    if (next || isHistoryTransaction(tr)) return next

    const removed = tr.steps.filter((step): step is RemoveMarkStep =>
      step instanceof RemoveMarkStep && step.mark.type === email)

    if (!removed.length) return next

    return scanner.around(state.doc, state.selection).find(syntax => removed.some(step =>
      isAddressLabel(step.mark.attrs.href, syntax.address)
      && step.from <= syntax.from && step.to >= syntax.to)) ?? null
  }

  plugin.spec.appendTransaction = (transactions, oldState, state) =>
    editor?.composing || transactions.some(isComposition)
      ? null
      : append.call(plugin, transactions, oldState, state)
  plugin.spec.view = (view) => {
    editor = view
    return {
      destroy: () => {
        editor = null
      },
    }
  }

  return plugin
})

/** Maps edited address spans through plain pastes and composition, then repairs only their changed textblocks. */
const emailDestinations = $prose((ctx) => {
  const code = inlineCodeSchema.type(ctx)
  const email = emailSchema.type(ctx)
  const link = linkSchema.type(ctx)
  const scanner = scannerFor(ctx.get(remarkCtx), code, email, link)
  const addressMarks = [email, link]
  let editor: EditorView | null = null

  return new Plugin<PendingEmail[]>({
    key: syncKey,
    state: {
      init: () => [],
      apply: (tr, pending) => {
        if (tr.getMeta(syncKey)) return []

        const mapped = pending
          .filter(target => !replacedByLink(tr, target, addressMarks) && !removedEmail(tr, target, email))
          .map(target => ({ ...target, ...mapSpan(tr.mapping, target) }))

        if (tr.docChanged && !isHistoryTransaction(tr)) {
          const changed = previousChanges(tr)

          for (const { node, start } of textblocksWithin(tr.before, changed)) {
            const block = scanner.block(node)

            if (!block) continue

            for (const run of block.links) {
              const span = { ...run, from: start + run.from, to: start + run.to }

              if (run.mark.type !== email || !isAddressLabel(run.mark.attrs.href, run.text)
                || node.rangeHasMark(run.from, run.to, code)
                || !changed.some(range => range.from <= span.to && range.to >= span.from)
                || replacedByLink(tr, span, addressMarks) || removedEmail(tr, span, email)) continue

              const target = { mark: run.mark, ...mapSpan(tr.mapping, span) }

              if (!mapped.some(other => other.from === target.from && other.to === target.to && other.mark.eq(target.mark))) {
                mapped.push(target)
              }
            }
          }
        }

        return mapped.filter(target => target.to > target.from)
      },
    },
    appendTransaction: (transactions, _, state) => {
      const pending = syncKey.getState(state)

      if (!pending?.length || editor?.composing || transactions.some(isComposition)) return null

      const tr = state.tr
      const changes: EmailLinkChange[] = []

      for (const target of pending) {
        for (const { node, start } of textblocksWithin(state.doc, [target])) {
          const block = scanner.block(node)

          if (!block) continue

          let from = Math.max(0, target.from - start)
          let to = Math.min(node.content.size, target.to - start)

          // Boundary input belongs to this address only when it inherited its mark.
          for (const run of block.links) {
            if (run.mark.eq(target.mark) && run.from <= to && run.to >= from) {
              from = Math.min(from, run.from)
              to = Math.max(to, run.to)
            }
          }

          if (to <= from) continue

          tr.removeMark(start + from, start + to, target.mark)
          changes.push({ from: start + from, to: start + to, previous: target.mark, next: null })

          for (const address of scanner.addresses(node, { from, to })) {
            if (address.bracketed || address.from < from || address.to > to
              || block.links.some(run => !run.mark.eq(target.mark) && run.from < address.to && run.to > address.from)) continue

            const next = email.create({ ...target.mark.attrs, href: `mailto:${address.address}` })
            const span = { from: start + address.from, to: start + address.to }

            tr.addMark(span.from, span.to, next)
            changes.push({ ...span, previous: target.mark, next })
          }
        }
      }

      return (tr.doc.eq(state.doc) ? state.tr : tr)
        .setMeta(syncKey, true)
        .setMeta(emailLinkChanges, changes)
    },
    props: {
      handleDOMEvents: {
        compositionend: (view) => {
          setTimeout(() => {
            if (!view.isDestroyed && !view.composing && syncKey.getState(view.state)?.length) {
              view.dispatch(view.state.tr)
            }
          })

          return false
        },
      },
    },
    view: (view) => {
      editor = view
      return {
        destroy: () => {
          editor = null
        },
      }
    },
  })
})

function isComposition(tr: Transaction) {
  return tr.getMeta('composition') !== undefined
}

function convertEmail(tr: Transaction, { from, to, address, bracketed }: EmailSyntax, link: MarkType) {
  if (bracketed) tr.delete(to - 1, to).delete(from, from + 1)

  return tr.addMark(from, to - (bracketed ? 2 : 0), link.create({ href: `mailto:${address}`, title: null }))
}

function scannerFor(remark: RemarkParser, code: MarkType, email: MarkType, link: MarkType) {
  let scanner = scanners.get(remark)

  if (!scanner) {
    scanner = createScanner(remark, code, email, link)
    scanners.set(remark, scanner)
  }

  return scanner
}

/** Immutable textblocks share their cached scans across selection changes, mapping and serialization. */
function createScanner(remark: RemarkParser, code: MarkType, emailType: MarkType, link: MarkType) {
  const cache = new WeakMap<Node, Textblock>()
  const block = (node: Node) => {
    if (!node.isTextblock || node.type.spec.code) return null

    let value = cache.get(node)

    if (!value) {
      value = { text: plainText(node, code)!, links: linksIn(node, emailType, link) }
      cache.set(node, value)
    }

    return value
  }
  const addresses = (node: Node, { from, to }: Span) => {
    const value = block(node)

    if (!value) return []

    const ranges = value.addresses ??= new Map()
    const range = `${from}:${to}`
    let matches = ranges.get(range)

    if (!matches) {
      // Existing links retain their own boundaries even beside unmarked text.
      matches = emailsOf(value.text.slice(from, to), remark)
        .map(email => ({ ...email, from: from + email.from, to: from + email.to }))
      ranges.set(range, matches)
    }

    return matches
  }
  const around = (doc: Node, { from, to }: Span) => {
    const $from = doc.resolve(from)
    const value = block($from.parent)

    if (!value || to > $from.end()) return []

    if (!value.syntax) {
      const chunks: string[] = []
      let offset = 0

      for (const run of value.links) {
        chunks.push(value.text.slice(offset, run.from), '\uFFFC'.repeat(run.to - run.from))
        offset = run.to
      }

      chunks.push(value.text.slice(offset))
      value.syntax = emailsOf(chunks.join(''), remark)
    }

    const start = $from.start()

    return value.syntax
      .map(email => ({ ...email, from: start + email.from, to: start + email.to }))
      .filter(email => email.from <= from && to <= email.to)
  }

  return { block, addresses, around }
}

/** Parses only inline email syntax, rejecting scheme and SCP tokens that happen to contain an address. */
function emailsOf(text: string, remark: RemarkParser) {
  const emails: EmailSyntax[] = []
  const paragraph = remark.parse(`x ${text}`).children.at(0)

  if (paragraph?.type !== 'paragraph') return emails

  const visit = (node: MarkdownNode) => {
    if (node.type !== 'link') {
      node.children?.forEach(visit)
      return
    }

    const start = node.position?.start.offset
    const end = node.position?.end.offset

    if (!node.url || start === undefined || end === undefined) return

    const from = start - 2
    const to = end - 2
    const source = text.slice(from, to)
    const bracketed = source.startsWith('<') && source.endsWith('>')
    const address = bracketed ? source.slice(1, -1) : source

    if (!isAddressLabel(node.url, address)) return
    if (!bracketed && /[\p{L}\p{N}_+\-@/\\:]/u.test(text.charAt(from - 1) + text.charAt(to))) return

    emails.push({ from, to, address, bracketed })
  }

  visit(paragraph)

  return emails
}

/** Complete marked replacements are new links; partial text edits and unmarked pastes keep the original address span. */
function replacedByLink(tr: Transaction, email: Span, marks: MarkType[]) {
  let span = email

  return tr.steps.some((step, index) => {
    if (step instanceof AddMarkStep && marks.includes(step.mark.type)
      && step.from <= span.from && step.to >= span.to) return true

    if ((step instanceof ReplaceStep || step instanceof ReplaceAroundStep)
      && step.from <= span.from && step.to >= span.to && step.to > step.from) {
      for (let child = 0; child < step.slice.content.childCount; child++) {
        const node = step.slice.content.child(child)

        if (marks.some(mark => mark.isInSet(node.marks) || node.rangeHasMark(0, node.content.size, mark))) return true
      }
    }

    span = mapSpan(tr.mapping.slice(index, index + 1), span)
    return false
  })
}

/** Explicit removal starts a new pending conversion rather than restoring the email mark immediately. */
function removedEmail(tr: Transaction, span: Span, email: MarkType) {
  return tr.steps.some(step => step instanceof RemoveMarkStep && step.mark.type === email
    && step.from <= span.from && step.to >= span.to)
}

/** Excludes unmarked boundary insertions, while retaining replacements that delete either edge of an address. */
function mapSpan(mapping: Mappable, span: Span): Span {
  const from = mapping.mapResult(span.from, 1)
  const to = mapping.mapResult(span.to, -1)

  return {
    from: from.deleted && from.deletedAfter ? mapping.map(span.from, -1) : from.pos,
    to: to.deleted && to.deletedBefore ? mapping.map(span.to, 1) : to.pos,
  }
}

function previousChanges(tr: Transaction): Span[] {
  const ranges: Span[] = []

  tr.mapping.maps.forEach((map, index) => {
    const previous = tr.mapping.slice(0, index).invert()

    map.forEach((from, to) => ranges.push({ from: previous.map(from, -1), to: previous.map(to, 1) }))

    const step = tr.steps[index]

    if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) {
      ranges.push({ from: previous.map(step.from, -1), to: previous.map(step.to, 1) })
    }
  })

  return ranges
}

function textblocksWithin(doc: Node, ranges: Span[]) {
  const blocks = new Map<Node, number>()

  for (const range of ranges) {
    doc.nodesBetween(Math.max(0, range.from - 1), Math.min(doc.content.size, range.to + 1), (node, pos) => {
      if (!node.isTextblock) return

      blocks.set(node, pos + 1)
      return false
    })
  }

  return Array.from(blocks, ([node, start]) => ({ node, start }))
}

function linksIn(parent: Node, email: MarkType, link: MarkType) {
  const links: EmailLink[] = []
  let current: EmailLink | null = null

  parent.forEach((child, offset) => {
    const mark = email.isInSet(child.marks) || link.isInSet(child.marks)

    if (!mark) {
      current = null
      return
    }

    const text = child.isText ? child.textContent : '\uFFFC'.repeat(child.nodeSize)

    if (current?.mark.eq(mark)) {
      current.text += text
      current.to = offset + child.nodeSize
    } else {
      current = { from: offset, to: offset + child.nodeSize, text, mark }
      links.push(current)
    }
  })

  return links
}

export const emailSyntax = [typedEmails, emailDestinations]
