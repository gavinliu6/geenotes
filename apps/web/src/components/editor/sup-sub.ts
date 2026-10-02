import type { remarkStringifyOptionsCtx } from '@milkdown/kit/core'
import { commandsCtx } from '@milkdown/kit/core'
import type { SliceType } from '@milkdown/kit/ctx'
import { toggleMark } from '@milkdown/kit/prose/commands'
import { $command, $markSchema, $remark, $useKeymap } from '@milkdown/kit/utils'

interface MdastNode {
  type: string
  value?: string
  children?: MdastNode[]
}

type StringifyOptions = typeof remarkStringifyOptionsCtx extends SliceType<infer T> ? T : never
type Handle = NonNullable<NonNullable<StringifyOptions['handlers']>['html']>

const markNames = { sup: 'superscript', sub: 'subscript' } as const

type Tag = keyof typeof markNames

/** Reads `<sup>`/`<sub>` pairs as marks and writes the marks back as tags. */
const supSubTags = $remark('supSubTags', () => function () {
  const data = this.data()
  const handlers: Record<string, Handle> = {
    superscript: tagHandler('sup'),
    subscript: tagHandler('sub'),
  }

  data.toMarkdownExtensions ??= []
  data.toMarkdownExtensions.push({ handlers })

  return wrapTags
})

function wrapTags(node: MdastNode) {
  const { children } = node

  if (!children) return

  for (let start = 0; start < children.length; start++) {
    const tag = (['sup', 'sub'] as const).find(name => isHtml(children[start], `<${name}>`))

    if (!tag) continue

    const end = children.findIndex(
      (child, index) => index > start && isHtml(child, `</${tag}>`)
    )

    if (end === -1) continue

    children.splice(start, end - start + 1, {
      type: markNames[tag],
      children: children.slice(start + 1, end),
    })
  }

  children.forEach(wrapTags)
}

function isHtml(node: MdastNode, html: string) {
  return node.type === 'html' && node.value?.toLowerCase() === html
}

function tagHandler(tag: Tag): Handle {
  return (node, _, state, info) => {
    const tracker = state.createTracker(info)
    const open = tracker.move(`<${tag}>`)
    const content = tracker.move(
      state.containerPhrasing(node, { ...tracker.current(), before: open, after: '<' })
    )

    return open + content + tracker.move(`</${tag}>`)
  }
}

function scriptSchema(tag: Tag, verticalAlign: string) {
  const name = markNames[tag]

  return $markSchema(name, () => ({
    excludes: 'superscript subscript',
    priority: 40,
    parseDOM: [{ tag }, { style: `vertical-align=${verticalAlign}` }],
    toDOM: () => [tag, 0],
    parseMarkdown: {
      match: node => node.type === name,
      runner: (state, node, markType) => {
        state.openMark(markType)
        state.next(node.children)
        state.closeMark(markType)
      },
    },
    toMarkdown: {
      match: mark => mark.type.name === name,
      runner: (state, mark) => {
        state.withMark(mark, name)
      },
    },
  }))
}

export const superscriptSchema = scriptSchema('sup', 'super')
export const subscriptSchema = scriptSchema('sub', 'sub')

export const toggleSuperscriptCommand = $command('ToggleSuperscript', ctx => () =>
  toggleMark(superscriptSchema.type(ctx), { removeWhenPresent: false }))

export const toggleSubscriptCommand = $command('ToggleSubscript', ctx => () =>
  toggleMark(subscriptSchema.type(ctx), { removeWhenPresent: false }))

export const superscriptKeymap = $useKeymap('superscriptKeymap', {
  ToggleSuperscript: {
    shortcuts: 'Mod-.',
    command: (ctx) => {
      const commands = ctx.get(commandsCtx)

      return () => commands.call(toggleSuperscriptCommand.key)
    },
  },
})

export const subscriptKeymap = $useKeymap('subscriptKeymap', {
  ToggleSubscript: {
    shortcuts: 'Mod-,',
    command: (ctx) => {
      const commands = ctx.get(commandsCtx)

      return () => commands.call(toggleSubscriptCommand.key)
    },
  },
})

export const supSubMarks = [supSubTags, superscriptSchema, subscriptSchema].flat()

export const supSubCommands = [
  toggleSuperscriptCommand,
  toggleSubscriptCommand,
  superscriptKeymap,
  subscriptKeymap,
].flat()
