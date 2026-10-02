import { Plugin } from '@milkdown/kit/prose/state'
import { $prose } from '@milkdown/kit/utils'

/** Marks images that fail to load and strips `alt`/`title` so Chrome shows just the broken-image icon. */
export const failedImages = $prose(() =>
  new Plugin({
    view: (view) => {
      view.dom.addEventListener('error', markFailedImage, true)

      return {
        destroy: () =>
          view.dom.removeEventListener('error', markFailedImage, true),
      }
    },
  })
)

function markFailedImage({ target }: Event) {
  if (!(target instanceof HTMLImageElement)) return

  target.setAttribute('data-load-error', '')
  target.removeAttribute('alt')
  target.removeAttribute('title')
  target.addEventListener(
    'load',
    () => target.removeAttribute('data-load-error'),
    { once: true }
  )
}
