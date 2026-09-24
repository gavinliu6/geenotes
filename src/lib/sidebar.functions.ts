import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
// 400 days: the longest lifetime browsers still honour.
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400

export const getSidebarState = createIsomorphicFn()
  .server(() => getCookie(SIDEBAR_COOKIE_NAME) !== 'false')
  .client(() => {
    const entry = document.cookie
      .split('; ')
      .find(cookie => cookie.startsWith(`${SIDEBAR_COOKIE_NAME}=`))

    return entry?.slice(SIDEBAR_COOKIE_NAME.length + 1) !== 'false'
  })

/** Persists the desktop sidebar state for `getSidebarState` to pick up. */
export function persistSidebarState(open: boolean) {
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`
}
