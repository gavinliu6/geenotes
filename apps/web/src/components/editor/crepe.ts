import { Crepe } from '@milkdown/crepe'
import { editorViewOptionsCtx } from '@milkdown/kit/core'
import { inlineCodeInputRule } from '@milkdown/kit/preset/commonmark'

import { toastManager } from '@/components/ui/toast'
import { uploadImage } from '@/utils/uploads.functions'

import { alertCommands } from './alert'
import { bracketPairs } from './bracket-pairs'
import { changeListener } from './change-listener'
import { codeBoundary } from './code-boundary'
import { codeCopyFeedback, linkCopyFeedback } from './copy-feedback'
import { failedImages } from './failed-images'
import { createFeatureConfigs, features } from './features'
import { backtickPairs, codeLinkTails, innermostInlineCode } from './inline-code'
import { languagePickerKeys } from './language-picker'
import { linkSyntax } from './link-syntax'
import { withMarkdownDialect } from './markdown'
import { quoteKeymap } from './quote'
import { slashMenuHighlight } from './slash-menu'
import { startBoundary } from './start-boundary'
import { supSubCommands } from './sup-sub'
import { taskListToggle } from './task-list'
import { trailingOnLoad } from './trailing'

export interface CrepeOptions {
  defaultValue: string
  placeholder: string
  ariaLabel?: string
  onChange: (serialize: () => string) => void
  /** Returns whether something outside the editor took the focus. */
  onExitStart: () => boolean
}

export function createCrepe(
  root: HTMLElement,
  { defaultValue, placeholder, ariaLabel, onChange, onExitStart }: CrepeOptions
) {
  const codeCopy = codeCopyFeedback()
  const crepe = new Crepe({
    root,
    defaultValue,
    features,
    featureConfigs: createFeatureConfigs({
      placeholder,
      onUpload: uploadImageFile,
      onCopyLink: linkCopyFeedback(root),
      onCopyCode: codeCopy.onCopy,
    }),
  })

  void crepe.editor.remove(inlineCodeInputRule)

  withMarkdownDialect(crepe.editor)
    .config((ctx) => {
      ctx.update(editorViewOptionsCtx, options => ({
        ...options,
        attributes: {
          'class': 'markdown-body',
          'role': 'textbox',
          'aria-multiline': 'true',
          ...(ariaLabel && { 'aria-label': ariaLabel }),
        },
      }))
    })
    .use(failedImages)
    .use(trailingOnLoad)
    .use(taskListToggle)
    .use(codeBoundary)
    .use(startBoundary(onExitStart))
    .use(codeCopy.plugin)
    .use(languagePickerKeys)
    .use(supSubCommands)
    .use(alertCommands)
    .use(quoteKeymap)
    .use(innermostInlineCode)
    .use(backtickPairs)
    .use(codeLinkTails)
    .use(bracketPairs)
    .use(linkSyntax)
    .use(slashMenuHighlight)
    .use(changeListener(onChange))

  return crepe
}

async function uploadImageFile(file: File) {
  const data = new FormData()

  data.set('file', file)

  try {
    const { url } = await uploadImage({ data })

    return url
  } catch (error) {
    toastManager.add({ type: 'error', description: 'Failed to upload image' })
    throw error
  }
}
