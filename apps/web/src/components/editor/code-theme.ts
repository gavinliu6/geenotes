import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const theme = EditorView.theme({
  '&': {
    color: 'var(--color-fg)',
    backgroundColor: 'transparent',
    fontSize: '0.875rem',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.5rem',
  },
  '.cm-content': {
    padding: '0 0 0 0.5rem',
    caretColor: 'var(--color-fg)',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-fg)',
    borderLeftWidth: '1px',
    marginLeft: '0',
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--color-text-selection)',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-gutters': {
    color: 'var(--color-fg-muted)',
    backgroundColor: 'var(--color-muted)',
    border: 'none',
  },
  '.cm-foldGutter': {
    display: 'none !important',
  },
  '.cm-foldPlaceholder': {
    margin: '0 0.25rem',
    padding: '0 0.25rem',
    border: 'none',
    borderRadius: '0.25rem',
    color: 'var(--color-fg-muted)',
    backgroundColor: 'var(--color-highlight)',
  },
  '.cm-matchingBracket, .cm-nonmatchingBracket': {
    backgroundColor: 'var(--color-highlight)',
  },
})

const highlight = HighlightStyle.define([
  { tag: tags.comment, color: 'var(--color-fg-muted)', fontStyle: 'italic' },
  {
    tag: [
      tags.keyword,
      tags.modifier,
      tags.operatorKeyword,
      tags.controlKeyword,
      tags.definitionKeyword,
      tags.moduleKeyword,
    ],
    color: 'var(--color-fg-info)',
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp, tags.escape],
    color: 'var(--color-fg-success)',
  },
  {
    tag: [tags.number, tags.bool, tags.null, tags.atom, tags.literal],
    color: 'var(--color-fg-accent)',
  },
  {
    tag: [
      tags.function(tags.variableName),
      tags.function(tags.propertyName),
      tags.definition(tags.variableName),
    ],
    color: 'var(--color-fg)',
    fontWeight: '500',
  },
  {
    tag: [tags.className, tags.typeName, tags.tagName, tags.namespace],
    color: 'var(--color-fg-info)',
  },
  { tag: tags.heading, fontWeight: '600' },
  { tag: tags.strong, fontWeight: '600' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.link, textDecoration: 'underline' },
  { tag: tags.invalid, color: 'var(--color-fg-danger)' },
])

/** Colors code blocks with the app's semantic tokens so they follow the theme. */
export const codeTheme = { extension: [theme, syntaxHighlighting(highlight)] }
