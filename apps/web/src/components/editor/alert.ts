import type { remarkStringifyOptionsCtx } from '@milkdown/kit/core'
import { InitReady, remarkPluginsCtx } from '@milkdown/kit/core'
import type { MilkdownPlugin, SliceType } from '@milkdown/kit/ctx'
import { blockContainerTypes } from '@milkdown/kit/preset/commonmark'
import { wrapIn } from '@milkdown/kit/prose/commands'
import { InputRule } from '@milkdown/kit/prose/inputrules'
import type { Node } from '@milkdown/kit/prose/model'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import type { NodeViewConstructor } from '@milkdown/kit/prose/view'
import type { RemarkPlugin } from '@milkdown/kit/transformer'
import {
  $command,
  $inputRule,
  $nodeSchema,
  $prose,
  $useKeymap,
  $view
} from '@milkdown/kit/utils'
import * as icons from 'lucide-static'

import { isEmptyParagraph } from './commands'

export const alertTypes = ['note', 'tip', 'important', 'warning', 'caution'] as const

export type AlertType = (typeof alertTypes)[number]

export const alertLabels: Record<AlertType, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
}

export const alertIcons: Record<AlertType, string> = {
  note: icons.Info,
  tip: icons.Lightbulb,
  important: icons.MessageSquareWarning,
  warning: icons.TriangleAlert,
  caution: icons.OctagonAlert,
}

interface MdastNode {
  type: string
  value?: string
  alertType?: AlertType
  children?: MdastNode[]
}

type StringifyOptions = typeof remarkStringifyOptionsCtx extends SliceType<infer T> ? T : never
type Handle = NonNullable<NonNullable<StringifyOptions['handlers']>['html']>

const typePattern = alertTypes.join('|')
const markerPattern = new RegExp(String.raw`^\[!(${typePattern})\][\t ]*(?:(\r?\n|\r)|$)`, 'i')

/** Reads blockquotes that open with a `[!TYPE]` line as alerts and writes them back with the marker unescaped. */
const remarkAlert: RemarkPlugin = {
  plugin: function () {
    const data = this.data()
    const handlers: Record<string, Handle> = {
      alert: (node: MdastNode, parent, state, info) =>
        state.handle(toBlockquote(node), parent, state, info),
    }

    data.toMarkdownExtensions ??= []
    data.toMarkdownExtensions.push({ handlers })

    return tagAlerts
  },
  options: {},
}

/** Registers the transform ahead of the preset's own, so those see the alert without its marker line and an image right below the marker still becomes an image block. */
const remarkAlertFirst: MilkdownPlugin = ctx => async () => {
  await ctx.wait(InitReady)

  ctx.update(remarkPluginsCtx, plugins => [remarkAlert, ...plugins])
  ctx.update(blockContainerTypes.key, types => [...types, 'alert'])

  return () => {
    ctx.update(remarkPluginsCtx, plugins => plugins.filter(plugin => plugin !== remarkAlert))
  }
}

function tagAlerts(node: MdastNode) {
  if (node.type === 'blockquote') {
    const alertType = takeMarker(node)

    if (alertType) {
      node.type = 'alert'
      node.alertType = alertType
    }
  }

  node.children?.forEach(tagAlerts)
}

/** Removes the marker line GitHub requires: `[!TYPE]` alone on the first line. A lone marker is taken as an empty alert. */
function takeMarker(blockquote: MdastNode): AlertType | undefined {
  const blocks = blockquote.children ?? []
  const paragraph = blocks.at(0)

  if (paragraph?.type !== 'paragraph' || !paragraph.children) return

  const inlines = paragraph.children
  const text = inlines.at(0)
  const next = inlines.at(1)

  if (text?.type !== 'text' || text.value === undefined) return

  const match = markerPattern.exec(text.value)

  if (!match) return

  if (match[2]) {
    text.value = text.value.slice(match[0].length)

    if (!text.value) inlines.shift()
  } else if (next?.type === 'break') {
    inlines.splice(0, 2)
  } else if (!next) {
    blocks.shift()
  } else {
    return
  }

  return match[1].toLowerCase() as AlertType
}

/** Puts the marker on the first line of the first paragraph, or in a paragraph of its own when that paragraph starts with inline HTML, which the serializer would pull up onto the marker line. */
function toBlockquote({ alertType = 'note', children = [] }: MdastNode): MdastNode {
  const marker = { type: 'html', value: `[!${alertType.toUpperCase()}]` }
  const first = children.at(0)
  const inlines = first?.type === 'paragraph' ? first.children ?? [] : []

  if (inlines.length > 0 && inlines[0].type !== 'html') {
    const paragraph = { type: 'paragraph', children: [marker, { type: 'text', value: '\n' }, ...inlines] }

    return { type: 'blockquote', children: [paragraph, ...children.slice(1)] }
  }

  return { type: 'blockquote', children: [{ type: 'paragraph', children: [marker] }, ...children] }
}

function isEmptyAlert(node: Node) {
  return node.childCount === 1 && isEmptyParagraph(node.child(0))
}

export const alertSchema = $nodeSchema('alert', () => ({
  content: 'block+',
  group: 'block',
  defining: true,
  attrs: {
    alertType: { default: 'note', validate: 'string' },
  },
  parseDOM: [
    { tag: '.markdown-alert-title', ignore: true, priority: 60 },
    {
      tag: 'div.markdown-alert',
      getAttrs: (dom) => {
        const alertType = alertTypes.find(type => dom.classList.contains(`markdown-alert-${type}`))

        return alertType ? { alertType } : false
      },
    },
  ],
  toDOM: (node) => {
    const alertType = node.attrs.alertType as AlertType

    return [
      'div',
      { class: `markdown-alert markdown-alert-${alertType}` },
      ['p', { class: 'markdown-alert-title' }, alertLabels[alertType]],
      ['div', 0],
    ]
  },
  parseMarkdown: {
    match: node => node.type === 'alert',
    runner: (state, node, type) => {
      state.openNode(type, { alertType: node.alertType }).next(node.children).closeNode()
    },
  },
  toMarkdown: {
    match: node => node.type.name === 'alert',
    runner: (state, node) => {
      state.openNode('alert', undefined, { alertType: node.attrs.alertType })

      if (!isEmptyAlert(node)) state.next(node.content)

      state.closeNode()
    },
  },
}))

/** Renders the type as a select in the title so it can be switched in place. */
const alertView = $view(alertSchema.node, (): NodeViewConstructor => (initialNode, view, getPos) => {
  let node = initialNode
  const dom = document.createElement('div')
  const title = document.createElement('div')
  const select = document.createElement('select')
  const button = document.createElement('button')
  const contentDOM = document.createElement('div')

  dom.className = 'markdown-alert'
  title.className = 'markdown-alert-title'
  title.contentEditable = 'false'
  select.ariaLabel = 'Alert type'
  button.replaceChildren(document.createElement('selectedcontent'))
  select.replaceChildren(button)
  contentDOM.className = 'markdown-alert-content'

  for (const alertType of alertTypes) {
    const option = document.createElement('option')

    option.value = alertType
    option.dataset.alertType = alertType
    option.innerHTML = alertIcons[alertType] + alertLabels[alertType]
    select.add(option)
  }

  title.replaceChildren(select)
  dom.replaceChildren(title, contentDOM)

  const render = () => {
    dom.dataset.alertType = node.attrs.alertType
    select.value = node.attrs.alertType
  }

  select.addEventListener('change', () => {
    const pos = getPos()

    if (pos === undefined) return

    view.dispatch(view.state.tr.setNodeAttribute(pos, 'alertType', select.value))
    requestAnimationFrame(() => view.focus())
  })

  select.addEventListener('pointermove', (event) => {
    const option = event.target instanceof Element ? event.target.closest('option') : null

    if (option && option !== document.activeElement) option.focus()
  })

  render()

  return {
    dom,
    contentDOM,
    update: (next) => {
      if (next.type !== node.type) return false

      node = next
      render()

      return true
    },
    stopEvent: event => event.target instanceof Element && title.contains(event.target),
    ignoreMutation: ({ type, target }) =>
      title.contains(target) || (target === dom && type === 'attributes'),
  }
})

export const wrapInAlertCommand = $command('WrapInAlert', ctx => (alertType: AlertType = 'note') =>
  wrapIn(alertSchema.type(ctx), { alertType }))

const typedMarkerKey = new PluginKey<boolean>('alertTypedMarker')

/** Typing `[!TYPE]` at the start of a blockquote turns it into that alert; typed at the start of an alert, it switches the type. */
const alertInputRule = $inputRule(ctx =>
  new InputRule(
    new RegExp(String.raw`^\[!(${typePattern})\]$`, 'i'),
    (state, [, alertType], start, end) => {
      const $start = state.doc.resolve(start)

      if ($start.parent.type.name !== 'paragraph' || $start.index(-1) !== 0) return null
      if (!['blockquote', 'alert'].includes($start.node(-1).type.name)) return null

      return state.tr
        .delete(start, end)
        .setNodeMarkup($start.before(-1), alertSchema.type(ctx), { alertType: alertType.toLowerCase() })
        .setMeta(typedMarkerKey, true)
    }
  )
)

const typedMarker = $prose(() =>
  new Plugin({
    key: typedMarkerKey,
    state: {
      init: () => false,
      apply: (tr, typed: boolean) =>
        tr.getMeta(typedMarkerKey) ?? (tr.docChanged || tr.selectionSet ? false : typed),
    },
  })
)

/** Takes an Enter right after a typed marker as the end of the marker line, where it would otherwise lift the caret out of the still empty alert. */
const typedMarkerKeymap = $useKeymap('alertTypedMarker', {
  EndMarkerLine: {
    shortcuts: 'Enter',
    priority: 100,
    command: () => (state, dispatch) => {
      if (!typedMarkerKey.getState(state)) return false

      dispatch?.(state.tr.setMeta(typedMarkerKey, false))

      return true
    },
  },
})

export const alertNode = [remarkAlertFirst, alertSchema, alertView].flat()

export const alertCommands = [wrapInAlertCommand, alertInputRule, typedMarker, typedMarkerKeymap].flat()
