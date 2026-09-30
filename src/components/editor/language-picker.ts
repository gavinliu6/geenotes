import { EditorView } from '@codemirror/view'
import { Plugin } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

const ITEM = '.language-list-item:not(.no-result)'

/** Moves through the code block language results with the arrow keys and picks one with Enter. */
export const languagePickerKeys = $prose(() =>
  new Plugin({
    view: (view) => {
      const onKeydown = (event: KeyboardEvent) => {
        const list = listOf(event.target)

        if (!list) return

        const items = [...list.querySelectorAll<HTMLElement>(ITEM)]
        const current = items.findIndex(item => item.hasAttribute('data-active'))

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()

          if (items.length === 0) return

          const step = event.key === 'ArrowDown' ? 1 : -1
          const next = current === -1
            ? (step === 1 ? 0 : items.length - 1)
            : Math.min(Math.max(current + step, 0), items.length - 1)

          setActive(list, items[next])
          items[next].scrollIntoView({ block: 'nearest' })
        } else if (event.key === 'Enter' && current !== -1) {
          event.preventDefault()
          items[current].click()
          focusCode(list)
        } else if (event.key === 'Escape') {
          setActive(list, null)
        }
      }

      const onInput = (event: Event) => {
        const list = listOf(event.target)

        if (list) setActive(list, null)
      }

      const onPointerDown = (event: PointerEvent) => {
        if (!(event.target instanceof Element)) return

        const list = event.target.closest('.clear-icon') && listOf(event.target)

        if (list) setActive(list, null)
      }

      const onPointerMove = (event: PointerEvent) => {
        if (!(event.target instanceof Element)) return

        const item = event.target.closest<HTMLElement>(ITEM)
        const list = item?.closest<HTMLElement>('.language-list')

        if (item && list && !item.hasAttribute('data-active')) setActive(list, item)
      }

      view.dom.addEventListener('keydown', onKeydown, true)
      view.dom.addEventListener('input', onInput)
      view.dom.addEventListener('pointerdown', onPointerDown, true)
      view.dom.addEventListener('pointermove', onPointerMove)

      return {
        destroy: () => {
          view.dom.removeEventListener('keydown', onKeydown, true)
          view.dom.removeEventListener('input', onInput)
          view.dom.removeEventListener('pointerdown', onPointerDown, true)
          view.dom.removeEventListener('pointermove', onPointerMove)
        },
      }
    },
  })
)

function listOf(target: EventTarget | null) {
  if (!(target instanceof Element) || !target.closest('.search-box')) return null

  return target.closest('.list-wrapper')?.querySelector<HTMLElement>('.language-list') ?? null
}

function setActive(list: HTMLElement, item: HTMLElement | null) {
  list.querySelector('[data-active]')?.removeAttribute('data-active')

  if (item) item.dataset.active = ''
}

function focusCode(list: HTMLElement) {
  const editor = list.closest('.milkdown-code-block')?.querySelector<HTMLElement>('.cm-editor')

  if (editor) EditorView.findFromDOM(editor)?.focus()
}
