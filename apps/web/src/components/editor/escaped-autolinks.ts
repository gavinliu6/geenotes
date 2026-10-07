import type { RemarkPluginRaw, Root } from '@milkdown/kit/transformer'

type MdastNode = Root | Root['children'][number]
type TextNode = Extract<MdastNode, { type: 'text' }>
interface EscapedRange {
  from: number
  to: number
}

/** Preserve GFM's fallback while keeping escaped autolink candidates as text. */
export const remarkEscapedAutolinks: RemarkPluginRaw<undefined> = function () {
  const ranges = new WeakMap<TextNode, EscapedRange[]>()
  const data = this.data()
  const extensions = data.fromMarkdownExtensions ??= []

  // The fallback replaces text nodes without retaining their source positions.
  // Record decoded offsets before it runs, directly from the parser's tokens.
  extensions.push({
    enter: {
      characterEscape(token) {
        this.config.enter.data.call(this, token)
        const node = this.stack[this.stack.length - 1]
        if (node.type !== 'text') return
        const escaped = ranges.get(node) ?? []
        escaped.push({ from: node.value.length, to: node.value.length + 1 })
        ranges.set(node, escaped)
      },
      characterReference(token) {
        this.config.enter.data.call(this, token)
        const node = this.stack[this.stack.length - 1]
        if (node.type !== 'text') return
        const escaped = ranges.get(node) ?? []
        escaped.push({ from: node.value.length, to: node.value.length })
        ranges.set(node, escaped)
      },
    },
    exit: {
      characterReference(token) {
        const node = this.stack.pop()
        if (node?.type !== 'text') return
        node.position!.end = {
          line: token.end.line,
          column: token.end.column,
          offset: token.end.offset,
        }
        const escaped = ranges.get(node)
        if (escaped) escaped[escaped.length - 1].to = node.value.length
      },
    },
  })

  for (const extension of extensions.flat()) {
    if (!extension.enter?.literalAutolink || !extension.transforms) continue
    extension.transforms = extension.transforms.map(transform => (tree) => {
      const protectedNodes: {
        children: MdastNode[]
        node: TextNode
        placeholder: Extract<MdastNode, { type: 'inlineCode' }>
      }[] = []

      function protect(parent: MdastNode) {
        if (parent.type === 'link' || parent.type === 'linkReference' || !('children' in parent)) return
        const children: MdastNode[] = parent.children
        children.forEach((node, index) => {
          if (node.type === 'text' && ranges.has(node)) {
            const placeholder = { type: 'inlineCode' as const, value: node.value }
            protectedNodes.push({ children, node, placeholder })
            children[index] = placeholder
          } else {
            protect(node)
          }
        })
      }

      protect(tree)
      const result = transform(tree) ?? tree

      for (const { children, node, placeholder } of protectedNodes) {
        const candidates: Root = {
          type: 'root',
          children: [{ type: 'paragraph', children: [{ ...node }] }],
        }
        const parsed = transform(candidates) ?? candidates
        const paragraph = parsed.children[0]
        if (paragraph.type !== 'paragraph') continue

        let offset = 0
        const replacements = paragraph.children.map((candidate) => {
          const value = candidate.type === 'link'
            ? candidate.children.map(child => child.type === 'text' ? child.value : '').join('')
            : candidate.type === 'text' ? candidate.value : ''
          const from = offset
          offset += value.length
          if (candidate.type === 'link' && ranges.get(node)!.some(range => range.from < offset && range.to > from)) {
            return { type: 'text' as const, value }
          }
          return candidate
        })
        children.splice(children.indexOf(placeholder), 1, ...replacements)
      }

      return result
    })
  }
}
