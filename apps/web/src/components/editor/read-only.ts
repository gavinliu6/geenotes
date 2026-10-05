import { EditorState } from '@codemirror/state'
import { EditorView as CodeMirrorView } from '@codemirror/view'
import { Plugin } from '@milkdown/kit/prose/state'
import type { EditorView } from '@milkdown/kit/prose/view'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $prose } from '@milkdown/kit/utils'

const nodeViews = new Set(['code_block', 'image-block', 'alert'])

/** Keeps the caret out of read-only code blocks; CodeMirror's `readOnly` alone still lets them take focus. */
export const readOnlyCodeBlock = CodeMirrorView.editable.compute(
  [EditorState.readOnly],
  state => !state.readOnly
)

/** Updates the node views that only check `view.editable` when they update, since toggling read-only mode alone doesn't update them. */
export const readOnlyNodeViews = $prose(() => {
  let editor: EditorView | null = null

  return new Plugin({
    view: (view) => {
      editor = view

      return {
        destroy: () => {
          editor = null
        },
      }
    },
    props: {
      decorations: (state) => {
        if (!editor || editor.editable) return null

        const decorations: Decoration[] = []

        state.doc.descendants((node, pos) => {
          if (nodeViews.has(node.type.name)) decorations.push(Decoration.node(pos, pos + node.nodeSize, {}))

          return !node.isTextblock
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
})
