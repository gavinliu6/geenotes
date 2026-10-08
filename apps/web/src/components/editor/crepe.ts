import { Crepe } from '@milkdown/crepe'
import { editorViewOptionsCtx } from '@milkdown/kit/core'
import { uploadConfig } from '@milkdown/kit/plugin/upload'
import { emphasisStarInputRule, emphasisUnderscoreInputRule, inlineCodeInputRule, strongInputRule } from '@milkdown/kit/preset/commonmark'
import { strikethroughInputRule } from '@milkdown/kit/preset/gfm'

import { alertCommands } from './alert'
import { bracketPairs } from './bracket-pairs'
import { changeListener } from './change-listener'
import { codeCopyFeedback, linkCopyFeedback } from './copy-feedback'
import { emailSyntax } from './email-syntax'
import { emphasisSyntax } from './emphasis-syntax'
import { failedImages } from './failed-images'
import { createFeatureConfigs, features } from './features'
import { uploadImageFile, uploadImages } from './image-upload'
import { backtickPairs, inlineCodePaste, innermostInlineCode } from './inline-code'
import { languagePickerKeys } from './language-picker'
import { linkHoverPreview } from './link-preview'
import { linkSyntax } from './link-syntax'
import { markBoundary } from './mark-boundary'
import { withMarkdownDialect } from './markdown'
import { quoteKeymap } from './quote'
import { readOnlyNodeViews } from './read-only'
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
  void crepe.editor.remove(strongInputRule)
  void crepe.editor.remove(emphasisStarInputRule)
  void crepe.editor.remove(emphasisUnderscoreInputRule)
  void crepe.editor.remove(strikethroughInputRule)

  withMarkdownDialect(crepe.editor)
    .config((ctx) => {
      ctx.update(uploadConfig.key, config => ({
        ...config,
        uploader: uploadImages,
      }))
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
    .config(inlineCodePaste)
    .config(linkHoverPreview)
    .use(failedImages)
    .use(trailingOnLoad)
    .use(readOnlyNodeViews)
    .use(taskListToggle)
    .use(markBoundary)
    .use(startBoundary(onExitStart))
    .use(codeCopy.plugin)
    .use(languagePickerKeys)
    .use(supSubCommands)
    .use(alertCommands)
    .use(quoteKeymap)
    .use(innermostInlineCode)
    .use(backtickPairs)
    .use(bracketPairs)
    .use(emphasisSyntax)
    .use(linkSyntax)
    .use(emailSyntax)
    .use(slashMenuHighlight)
    .use(changeListener(onChange))

  return crepe
}
