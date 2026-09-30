import { editorViewCtx, EditorViewReady } from '@milkdown/kit/core'
import type { MilkdownPlugin } from '@milkdown/kit/ctx'
import { trailingConfig } from '@milkdown/kit/plugin/trailing'

/** Crepe's trailing plugin only appends its empty paragraph from `appendTransaction`, so a note that ends with a table or code block would load without one. */
export const trailingOnLoad: MilkdownPlugin = ctx => async () => {
  await ctx.wait(EditorViewReady)

  const view = ctx.get(editorViewCtx)
  const { state } = view
  const { shouldAppend, getNode } = ctx.get(trailingConfig.key)

  if (!shouldAppend(state.doc.lastChild, state)) return

  view.dispatch(
    state.tr
      .insert(state.doc.content.size, getNode(state))
      .setMeta('addToHistory', false)
  )
}
