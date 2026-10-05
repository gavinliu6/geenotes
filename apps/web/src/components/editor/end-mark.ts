import type { Node } from '@milkdown/kit/prose/model'
import { Plugin } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $prose } from '@milkdown/kit/utils'

interface Located {
  node: Node
  pos: number
}

/** Ends the note with a small square after its last character, or on the empty line below it that holds the caret. */
export const endMark = $prose(() =>
  new Plugin({
    props: {
      decorations: ({ doc, selection: { $head } }) => {
        const last = lastContent(doc, 0)

        if (!last) return null

        const line = $head.parent
        const { node, pos } = line.isTextblock && !line.content.size && $head.pos > last.pos + last.node.nodeSize
          ? { node: line, pos: $head.before() }
          : last

        if (!node.isTextblock || node.type.spec.code) return null

        const tail = node.lastChild
        const end = pos + node.nodeSize - 1

        return DecorationSet.create(doc, [
          !tail || tail.isText
            ? Decoration.node(pos, end + 1, { class: 'end-mark' })
            : Decoration.node(end - tail.nodeSize, end, { nodeName: 'span', class: 'end-mark' }),
        ])
      },
    },
  })
)

/** The last node that shows anything, skipping empty textblocks and looking inside lists, quotes and alerts. */
function lastContent(parent: Node, start: number): Located | null {
  let pos = start + parent.content.size

  for (let index = parent.childCount - 1; index >= 0; index--) {
    const node = parent.child(index)

    pos -= node.nodeSize

    if (node.isTextblock) {
      if (node.content.size) return { node, pos }
    } else if (node.isAtom || node.type.spec.tableRole === 'table') {
      return { node, pos }
    } else {
      const inner = lastContent(node, pos + 1)

      if (inner) return inner
    }
  }

  return null
}
