import { serializerCtx } from '@milkdown/kit/core'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

import { documentWithPendingInlineCode } from './inline-code'

const key = new PluginKey('changeListener')

/** Reports every document change as it happens; Milkdown's `updated` listener debounces by 200ms, so a flush right after typing would miss the last keystrokes. */
export function changeListener(onChange: (serialize: () => string) => void) {
  return $prose(ctx =>
    new Plugin({
      key,
      state: {
        init: () => null,
        apply: (tr, _, oldState, state) => {
          if (tr.getMeta('addToHistory') === false) return null
          // Typing over a closing backtick can complete a pair without changing the document.
          if (!tr.docChanged && documentWithPendingInlineCode(oldState).eq(documentWithPendingInlineCode(state))) return null

          onChange(() => ctx.get(serializerCtx)(documentWithPendingInlineCode(state)))

          return null
        },
      },
    })
  )
}
