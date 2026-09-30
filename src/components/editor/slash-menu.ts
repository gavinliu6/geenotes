import { Plugin } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

const MENU = '.milkdown-slash-menu'
const ITEM = `${MENU} .menu-groups li`

/** Opens the slash menu on its first item, keeps the highlighted item in view, and ignores the `pointerenter` the browser replays for a resting pointer when the list scrolls under it. */
export const slashMenuHighlight = $prose(() =>
  new Plugin({
    view: (view) => {
      const root = view.dom.parentElement
      let pointer: { x: number, y: number } | null = null

      const observer = new MutationObserver((records) => {
        for (const { target, attributeName, oldValue } of records) {
          if (!(target instanceof HTMLElement)) continue

          if (attributeName === 'data-show') {
            if (target.matches(MENU) && target.dataset.show === 'true' && oldValue !== 'true') {
              reset(target)
            }
          } else if (
            target.matches(`${ITEM}.hover`)
            && !oldValue?.split(' ').includes('hover')
          ) {
            target.scrollIntoView({ block: 'nearest' })
          }
        }
      })

      const onPointerMove = (event: PointerEvent) => {
        pointer = { x: event.clientX, y: event.clientY }
      }

      const onPointerEnter = (event: PointerEvent) => {
        if (
          pointer
          && event.clientX === pointer.x
          && event.clientY === pointer.y
          && event.target instanceof Element
          && event.target.matches(ITEM)
        ) {
          event.stopPropagation()
        }
      }

      if (root) {
        observer.observe(root, {
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'data-show'],
          attributeOldValue: true,
        })
        root.addEventListener('pointerenter', onPointerEnter, true)
      }

      document.addEventListener('pointermove', onPointerMove, true)

      return {
        destroy: () => {
          observer.disconnect()
          root?.removeEventListener('pointerenter', onPointerEnter, true)
          document.removeEventListener('pointermove', onPointerMove, true)
        },
      }
    },
  })
)

/** The hidden group tab is the only handle Crepe exposes for moving the highlight back to the first item. */
function reset(menu: HTMLElement) {
  menu.scrollTo({ top: 0, behavior: 'instant' })
  menu.querySelector('.tab-group li')?.dispatchEvent(new PointerEvent('pointerdown'))
}
