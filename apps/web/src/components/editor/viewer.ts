import { Crepe, CrepeFeature } from '@milkdown/crepe'
import { editorViewOptionsCtx } from '@milkdown/kit/core'

import { codeCopyFeedback } from './copy-feedback'
import { failedImages } from './failed-images'
import { createFeatureConfigs, features } from './features'
import { withMarkdownDialect } from './markdown'

/** Renders Markdown with the editor's schema and styling, minus every editing affordance. */
export function createViewer(root: HTMLElement, markdown: string) {
  const codeCopy = codeCopyFeedback()
  const crepe = new Crepe({
    root,
    defaultValue: markdown,
    features: {
      ...features,
      [CrepeFeature.Toolbar]: false,
      [CrepeFeature.BlockEdit]: false,
      [CrepeFeature.LinkTooltip]: false,
      [CrepeFeature.Placeholder]: false,
      [CrepeFeature.Cursor]: false,
    },
    featureConfigs: createFeatureConfigs({
      placeholder: '',
      onUpload: () => Promise.reject(new Error('Read-only')),
      onCopyLink: () => {},
      onCopyCode: codeCopy.onCopy,
    }),
  })

  crepe.setReadonly(true)

  withMarkdownDialect(crepe.editor)
    .config((ctx) => {
      ctx.update(editorViewOptionsCtx, options => ({
        ...options,
        attributes: { class: 'markdown-body' },
      }))
    })
    .use(failedImages)
    .use(codeCopy.plugin)

  return crepe
}
