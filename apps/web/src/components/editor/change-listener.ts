import { serializerCtx } from '@milkdown/kit/core'
import type { Transaction } from '@milkdown/kit/prose/state'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

import { documentWithPendingSyntax } from './typed-syntax'

const key = new PluginKey('changeListener')

/** Reports every document change as it happens; Milkdown's `updated` listener debounces by 200ms, so a flush right after typing would miss the last keystrokes. */
export function changeListener(onChange: (serialize: () => string) => void) {
  return $prose(ctx =>
    new Plugin({
      key,
      state: {
        init: () => null,
        apply: (tr, _, oldState, state) => {
          const appended = tr.getMeta('appendedTransaction') as Transaction | undefined

          if (tr.getMeta('addToHistory') === false || appended?.getMeta('addToHistory') === false) return null
          // Typing over a closing backtick can complete a pair without changing the document.
          if (!tr.docChanged && documentWithPendingSyntax(oldState).eq(documentWithPendingSyntax(state))) return null

          onChange(() => ctx.get(serializerCtx)(documentWithPendingSyntax(state)))

          return null
        },
      },
    })
  )
}
