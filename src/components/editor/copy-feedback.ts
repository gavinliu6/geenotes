import { Plugin } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

export const COPIED_DURATION = 1500

const resets = new WeakMap<HTMLElement, () => void>()

/** Flags `button` with `data-copied` until the timer runs out; copying again restarts it. */
function markCopied(button: HTMLElement, onReset?: () => void) {
  resets.get(button)?.()
  button.dataset.copied = ''

  const timer = setTimeout(reset, COPIED_DURATION)

  function reset() {
    clearTimeout(timer)
    delete button.dataset.copied
    resets.delete(button)
    onReset?.()
  }

  resets.set(button, reset)
}

/** Flags the link tooltip's copy button until it times out or the tooltip shows a link again. */
export function linkCopyFeedback(root: HTMLElement) {
  return () => {
    const preview = root.querySelector<HTMLElement>('.milkdown-link-preview')
    const button = preview?.querySelector<HTMLElement>('.link-icon')

    if (!preview || !button) return

    const observer = new MutationObserver((records) => {
      if (records.some(isShownAgain)) resets.get(button)?.()
    })

    markCopied(button, () => observer.disconnect())
    observer.observe(preview, {
      subtree: true,
      attributeFilter: ['data-show', 'href'],
      attributeOldValue: true,
    })
  }
}

/** Flags the code block copy button that was clicked once its copy succeeds. */
export function codeCopyFeedback() {
  let clicked: HTMLElement | null = null

  const plugin = $prose(() =>
    new Plugin({
      view: (view) => {
        const remember = (event: MouseEvent) => {
          clicked = event.target instanceof Element
            ? event.target.closest<HTMLElement>('.copy-button')
            : null
        }

        view.dom.addEventListener('click', remember, true)

        return {
          destroy: () => view.dom.removeEventListener('click', remember, true),
        }
      },
    })
  )

  const onCopy = () => {
    if (clicked) markCopied(clicked)
  }

  return { plugin, onCopy }
}

function isShownAgain({ attributeName, oldValue }: MutationRecord) {
  return attributeName === 'href' || oldValue === 'false'
}
