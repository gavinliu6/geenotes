import type { Mark } from '@milkdown/kit/prose/model'
import { PluginKey } from '@milkdown/kit/prose/state'

export interface EmailLinkChange {
  from: number
  to: number
  previous: Mark
  next: Mark | null
}

/** The destination changed while its text was edited; mark boundaries can keep the caret on its original side. */
export const emailLinkChanges = new PluginKey<readonly EmailLinkChange[]>('emailLinkChanges')

export function isEmailHref(href: unknown): href is string {
  return typeof href === 'string' && /^mailto:/i.test(href)
}

/** A custom label or a destination with query parameters keeps the ordinary link editor. */
export function isAddressLabel(href: unknown, text: string) {
  return isEmailHref(href) && href.slice(7) === text
}
