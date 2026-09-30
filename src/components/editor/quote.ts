import { chainCommands, lift } from '@milkdown/kit/prose/commands'
import { undoInputRule } from '@milkdown/kit/prose/inputrules'
import type { Command } from '@milkdown/kit/prose/state'
import { TextSelection } from '@milkdown/kit/prose/state'
import { $useKeymap } from '@milkdown/kit/utils'

const quoteTypes = ['blockquote', 'alert']

/** Milkdown's Backspace only joins textblocks, which merges a quote's first line into the block above and does nothing at the top of the note. */
const liftOutOfQuote: Command = (state, dispatch) => {
  const $cursor = state.selection instanceof TextSelection ? state.selection.$cursor : null

  if (!$cursor || $cursor.parentOffset > 0 || $cursor.index(-1) > 0) return false
  if (!quoteTypes.includes($cursor.node(-1).type.name)) return false

  return lift(state, dispatch)
}

export const quoteKeymap = $useKeymap('liftOutOfQuote', {
  LiftOutOfQuote: {
    shortcuts: 'Backspace',
    command: () => chainCommands(undoInputRule, liftOutOfQuote),
  },
})
