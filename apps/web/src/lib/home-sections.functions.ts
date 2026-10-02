import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

const COLLAPSED_SECTIONS_COOKIE_NAME = 'home_collapsed_sections'
// 400 days: the longest lifetime browsers still honour.
const COLLAPSED_SECTIONS_COOKIE_MAX_AGE = 60 * 60 * 24 * 400

export const getCollapsedHomeSections = createIsomorphicFn()
  .server(() => parseSections(getCookie(COLLAPSED_SECTIONS_COOKIE_NAME)))
  .client(() => {
    const entry = document.cookie
      .split('; ')
      .find(cookie => cookie.startsWith(`${COLLAPSED_SECTIONS_COOKIE_NAME}=`))

    return parseSections(entry?.slice(COLLAPSED_SECTIONS_COOKIE_NAME.length + 1))
  })

/** Persists a home section's collapsed state for `getCollapsedHomeSections` to pick up. */
export function persistHomeSectionCollapsed(id: string, isCollapsed: boolean) {
  const sections = new Set(getCollapsedHomeSections())

  if (isCollapsed) sections.add(id)
  else sections.delete(id)

  const maxAge = sections.size > 0 ? COLLAPSED_SECTIONS_COOKIE_MAX_AGE : 0

  document.cookie = `${COLLAPSED_SECTIONS_COOKIE_NAME}=${[...sections].join(':')}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function parseSections(value?: string) {
  return value ? value.split(':') : []
}
