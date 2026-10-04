import { linkPreviewTooltip, linkTooltipState } from '@milkdown/kit/component/link-tooltip'
import type { Ctx } from '@milkdown/kit/ctx'
import { linkSchema } from '@milkdown/kit/preset/commonmark'
import { posToDOMRect } from '@milkdown/kit/prose'
import type { Mark, MarkType } from '@milkdown/kit/prose/model'
import type { PluginView } from '@milkdown/kit/prose/state'
import type { EditorView } from '@milkdown/kit/prose/view'

/** Milkdown's link preview view, whose class isn't exported. */
interface LinkPreview extends PluginView {
  show: (mark: Mark, from: number, to: number, rect: DOMRect) => void
  hide: () => void
}

/** Previews the whole hovered link whether or not the editor has focus; Milkdown's preview needs focus and covers only the hovered text node, so editing or removing a partly bold link from it splits the link. */
export function linkHoverPreview(ctx: Ctx) {
  ctx.update(linkPreviewTooltip.key, (spec) => {
    const createView = spec.view

    if (!createView) return spec

    let preview: LinkPreview | null = null
    let timer: ReturnType<typeof setTimeout> | undefined

    const update = (view: EditorView, target: EventTarget | null) => {
      if (!preview || view.isDestroyed || ctx.get(linkTooltipState.key).mode === 'edit') return

      const link = linkAt(view, target, linkSchema.type(ctx))

      if (link) preview.show(link.mark, link.from, link.to, posToDOMRect(view, link.from, link.to))
      else preview.hide()
    }

    return {
      ...spec,
      view: (view) => {
        preview = createView(view) as LinkPreview

        return preview
      },
      props: {
        ...spec.props,
        handleDOMEvents: {
          ...spec.props?.handleDOMEvents,
          mousemove: (view, { target }) => {
            clearTimeout(timer)
            timer = setTimeout(() => update(view, target), 50)
          },
        },
      },
    }
  })
}

/** The link around `target`, spanning every text node that carries its mark. */
function linkAt(view: EditorView, target: EventTarget | null, type: MarkType) {
  const element = target instanceof Element ? target.closest('a') : null

  if (!element || !view.dom.contains(element)) return null

  const $pos = view.state.doc.resolve(view.posAtDOM(element, 0))
  const { parent } = $pos
  const index = $pos.index()
  const mark = type.isInSet(parent.maybeChild(index)?.marks ?? [])

  if (!mark) return null

  let start = index
  let end = index + 1

  while (start > 0 && mark.isInSet(parent.child(start - 1).marks)) start--
  while (end < parent.childCount && mark.isInSet(parent.child(end).marks)) end++

  return { mark, from: $pos.posAtIndex(start), to: $pos.posAtIndex(end) }
}
