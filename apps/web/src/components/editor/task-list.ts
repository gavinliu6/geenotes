import { Plugin } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

/** Toggles a task item when the checkbox drawn in its left padding is clicked. */
export const taskListToggle = $prose(() =>
  new Plugin({
    props: {
      handleClickOn: (view, _, node, nodePos, event, direct) => {
        if (
          !view.editable
          || !direct
          || node.type.name !== 'list_item'
          || typeof node.attrs.checked !== 'boolean'
        ) {
          return false
        }

        const dom = view.nodeDOM(nodePos)

        if (!(dom instanceof HTMLElement)) return false

        const { left, top } = dom.getBoundingClientRect()
        const { paddingLeft, lineHeight } = getComputedStyle(dom)

        if (event.clientX - left > Number.parseFloat(paddingLeft)) return false
        if (event.clientY - top > Number.parseFloat(lineHeight)) return false

        view.dispatch(
          view.state.tr.setNodeAttribute(nodePos, 'checked', !node.attrs.checked)
        )

        return true
      },
    },
  })
)
