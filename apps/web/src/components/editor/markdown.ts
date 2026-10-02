import { imageBlockSchema } from '@milkdown/kit/component/image-block'
import type { Editor } from '@milkdown/kit/core'
import { remarkStringifyOptionsCtx } from '@milkdown/kit/core'
import { $remark } from '@milkdown/kit/utils'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkCjkFriendlyGfmStrikethrough from 'remark-cjk-friendly-gfm-strikethrough'

import { alertNode } from './alert'
import { supSubMarks } from './sup-sub'

interface MdastNode {
  type: string
  title?: string | null
  children?: MdastNode[]
}

const cjkFriendly = $remark('remarkCjkFriendly', () => remarkCjkFriendly)
const cjkFriendlyStrikethrough = $remark(
  'remarkCjkFriendlyGfmStrikethrough',
  () => remarkCjkFriendlyGfmStrikethrough
)

/** Milkdown drops images whose title is `null`, which is what remark gives untitled ones. */
const untitledImages = $remark('untitledImages', () => () => fillImageTitles)

function fillImageTitles(node: MdastNode) {
  if (node.type === 'image' || node.type === 'image-block') node.title ??= ''
  node.children?.forEach(fillImageTitles)
}

/** Crepe shows the Markdown title as the caption; notes use the alt text for that and keep the title only to write it back. */
const imageBlockCaption = imageBlockSchema.extendSchema(prev => (ctx) => {
  const schema = prev(ctx)

  return {
    ...schema,
    attrs: { ...schema.attrs, title: { default: '', validate: 'string' } },
    parseDOM: [{
      tag: 'img[data-type="image-block"]',
      getAttrs: dom => ({
        src: dom.getAttribute('src') ?? '',
        caption: dom.getAttribute('caption') ?? '',
        title: dom.getAttribute('title') ?? '',
      }),
    }],
    parseMarkdown: {
      ...schema.parseMarkdown,
      runner: (state, node, type) => {
        state.addNode(type, {
          src: node.url,
          caption: node.alt,
          title: node.title,
        })
      },
    },
    toMarkdown: {
      ...schema.toMarkdown,
      runner: (state, node) => {
        const { src, caption, title } = node.attrs

        state.openNode('paragraph')
        state.addNode('image', undefined, undefined, {
          url: src,
          alt: caption,
          title,
        })
        state.closeNode()
      },
    },
  }
})

/** Applies the dialect notes are stored in on top of Crepe's CommonMark + GFM: CJK-friendly emphasis, `-` markers, alt text as image captions, `<sup>`/`<sub>` tags and GitHub alerts. */
export function withMarkdownDialect(editor: Editor) {
  return editor
    .config((ctx) => {
      ctx.update(remarkStringifyOptionsCtx, options => ({
        ...options,
        bullet: '-' as const,
        rule: '-' as const,
      }))
    })
    .use(cjkFriendly)
    .use(cjkFriendlyStrikethrough)
    .use(untitledImages)
    .use(imageBlockCaption)
    .use(supSubMarks)
    .use(alertNode)
}
