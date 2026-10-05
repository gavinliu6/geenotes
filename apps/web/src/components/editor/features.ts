import type { CrepeConfig } from '@milkdown/crepe'
import { CrepeFeature } from '@milkdown/crepe'
import { keymapRef } from '@milkdown/crepe/feature/toolbar'
import { commandsCtx } from '@milkdown/kit/core'
import {
  clearTextInCurrentBlockCommand,
  isMarkSelectedCommand
} from '@milkdown/kit/preset/commonmark'
import * as icons from 'lucide-static'

import { alertIcons, alertLabels, alertTypes, wrapInAlertCommand } from './alert'
import { codeTheme } from './code-theme'
import { checkIcon, copyIcon, enterIcon, pencilIcon, trashIcon } from './icon-markup'
import { readOnlyCodeBlock } from './read-only'
import {
  subscriptKeymap,
  subscriptSchema,
  superscriptKeymap,
  superscriptSchema,
  toggleSubscriptCommand,
  toggleSuperscriptCommand
} from './sup-sub'

interface FeatureOptions {
  placeholder: string
  onUpload: (file: File) => Promise<string>
  onCopyLink: () => void
  onCopyCode: () => void
}

export const features: CrepeConfig['features'] = {
  [CrepeFeature.ListItem]: false,
}

export function createFeatureConfigs({
  placeholder,
  onUpload,
  onCopyLink,
  onCopyCode,
}: FeatureOptions): CrepeConfig['featureConfigs'] {
  return {
    [CrepeFeature.Placeholder]: { text: placeholder, mode: 'doc' },
    [CrepeFeature.Cursor]: { virtual: false, color: false },
    [CrepeFeature.Toolbar]: {
      boldIcon: icons.Bold,
      italicIcon: icons.Italic,
      strikethroughIcon: icons.Strikethrough,
      codeIcon: icons.Code,
      linkIcon: icons.Link,
      latexIcon: icons.Sigma,
      buildToolbar: (builder) => {
        const formatting = builder.getGroup('formatting')

        formatting.addItem('superscript', {
          icon: icons.Superscript,
          label: 'Superscript',
          keymap: keymapRef(superscriptKeymap.key, 'ToggleSuperscript'),
          active: ctx =>
            ctx.get(commandsCtx).call(isMarkSelectedCommand.key, superscriptSchema.type(ctx)),
          onRun: ctx => ctx.get(commandsCtx).call(toggleSuperscriptCommand.key),
        })
        formatting.addItem('subscript', {
          icon: icons.Subscript,
          label: 'Subscript',
          keymap: keymapRef(subscriptKeymap.key, 'ToggleSubscript'),
          active: ctx =>
            ctx.get(commandsCtx).call(isMarkSelectedCommand.key, subscriptSchema.type(ctx)),
          onRun: ctx => ctx.get(commandsCtx).call(toggleSubscriptCommand.key),
        })
      },
    },
    [CrepeFeature.LinkTooltip]: {
      linkIcon: copyIcon + checkIcon,
      editButton: pencilIcon,
      removeButton: trashIcon,
      confirmButton: enterIcon,
      inputPlaceholder: 'Paste link…',
      onCopyLink,
    },
    [CrepeFeature.BlockEdit]: {
      textGroup: {
        text: { icon: icons.Type },
        h1: null,
        h2: { icon: icons.Heading2 },
        h3: { icon: icons.Heading3 },
        h4: { icon: icons.Heading4 },
        h5: null,
        h6: null,
        quote: { icon: icons.TextQuote },
        divider: { icon: icons.Minus },
      },
      listGroup: {
        bulletList: { icon: icons.List },
        orderedList: { icon: icons.ListOrdered },
        taskList: { icon: icons.ListTodo },
      },
      advancedGroup: {
        image: { icon: icons.Image },
        codeBlock: { icon: icons.SquareCode },
        table: { icon: icons.Table },
        math: { icon: icons.SquareSigma },
      },
      buildMenu: (builder) => {
        const alerts = builder.addGroup('alert', 'Alert')

        for (const alertType of alertTypes) {
          alerts.addItem(alertType, {
            label: alertLabels[alertType],
            icon: alertIcons[alertType],
            onRun: (ctx) => {
              const commands = ctx.get(commandsCtx)

              commands.call(clearTextInCurrentBlockCommand.key)
              commands.call(wrapInAlertCommand.key, alertType)
            },
          })
        }
      },
    },
    [CrepeFeature.ImageBlock]: {
      onUpload,
      blockImageIcon: icons.Image,
      blockCaptionIcon: icons.Info,
      blockCaptionPlaceholderText: 'Add a caption',
      blockUploadPlaceholderText: 'or paste an image link',
      inlineImageIcon: icons.Image,
      inlineUploadPlaceholderText: 'or paste an image link',
    },
    [CrepeFeature.Table]: {
      addRowIcon: icons.Plus,
      addColIcon: icons.Plus,
      deleteRowIcon: icons.Trash2,
      deleteColIcon: icons.Trash2,
      alignLeftIcon: icons.AlignLeft,
      alignCenterIcon: icons.AlignCenter,
      alignRightIcon: icons.AlignRight,
      colDragHandleIcon: icons.GripHorizontal,
      rowDragHandleIcon: icons.GripVertical,
    },
    [CrepeFeature.CodeMirror]: {
      theme: codeTheme,
      extensions: [readOnlyCodeBlock],
      expandIcon: icons.ChevronDown,
      searchIcon: icons.Search,
      clearSearchIcon: icons.X,
      copyIcon: copyIcon + checkIcon,
      onCopy: onCopyCode,
      previewToggleIcon: previewOnly => (previewOnly ? icons.EyeOff : icons.Eye),
    },
    [CrepeFeature.Latex]: {
      inlineEditConfirm: icons.CornerDownLeft,
    },
  }
}
