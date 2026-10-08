import { linkSchema } from '@milkdown/kit/preset/commonmark'
import { $markSchema } from '@milkdown/kit/utils'

import { isAddressLabel } from './email-link'

interface MarkdownNode {
  type: string
  url?: unknown
  value?: unknown
  children?: MarkdownNode[]
}

function labelOf(node: MarkdownNode): string {
  return node.children?.map(labelOf).join('') ?? (typeof node.value === 'string' ? node.value : '')
}

function isEmail(node: MarkdownNode) {
  return node.type === 'link' && isAddressLabel(node.url, labelOf(node))
}

function anchorAttrs(dom: HTMLElement) {
  return { href: dom.getAttribute('href') ?? '', title: dom.getAttribute('title') }
}

/** Email addresses share Markdown's link notation, while keeping their own editor semantics. */
export const emailSchema = $markSchema('email', (ctx) => {
  const schema = ctx.get(linkSchema.key)(ctx)

  return {
    ...schema,
    excludes: 'email link',
    parseDOM: [{
      tag: 'a[href]',
      priority: 60,
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false

        const attrs = anchorAttrs(dom)

        return isAddressLabel(attrs.href, dom.textContent) ? attrs : false
      },
    }],
    parseMarkdown: { ...schema.parseMarkdown, match: isEmail },
    toMarkdown: { ...schema.toMarkdown, match: mark => mark.type.name === 'email' },
  }
})

/** Custom mailto labels remain ordinary links in both Markdown and pasted HTML. */
const ordinaryLink = linkSchema.extendSchema(prev => (ctx) => {
  const schema = prev(ctx)

  return {
    ...schema,
    excludes: 'link email',
    parseDOM: [{
      tag: 'a[href]',
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false

        const attrs = anchorAttrs(dom)

        return isAddressLabel(attrs.href, dom.textContent) ? false : attrs
      },
    }],
    parseMarkdown: {
      ...schema.parseMarkdown,
      match: node => schema.parseMarkdown.match(node) && !isEmail(node),
    },
  }
})

export const emailMarks = [emailSchema, ordinaryLink].flat()
