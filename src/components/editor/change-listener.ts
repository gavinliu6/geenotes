import { serializerCtx } from '@milkdown/kit/core'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

const key = new PluginKey('changeListener')

/** Reports every document change as it happens; Milkdown's `updated` listener debounces by 200ms, so a flush right after typing would miss the last keystrokes. */
export function changeListener(onChange: (serialize: () => string) => void) {
  return $prose(ctx =>
    new Plugin({
      key,
      state: {
        init: () => null,
        apply: (tr) => {
          if (!tr.docChanged || tr.getMeta('addToHistory') === false) return null

          const { doc } = tr

          onChange(() => ctx.get(serializerCtx)(doc))

          return null
        },
      },
    })
  )
}
