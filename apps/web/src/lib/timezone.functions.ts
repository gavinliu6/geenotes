import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie, getRequest } from '@tanstack/react-start/server'

const TIME_ZONE_COOKIE_NAME = 'time_zone'
// 400 days: the longest lifetime browsers still honour.
const TIME_ZONE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400

export const getTimeZone = createIsomorphicFn()
  .server(() => resolveTimeZone(getCookie(TIME_ZONE_COOKIE_NAME) ?? getGeoTimeZone()))
  .client(() => Intl.DateTimeFormat().resolvedOptions().timeZone)

/** Persists the browser time zone for `getTimeZone` to pick up on the server. */
export function persistTimeZone() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  document.cookie = `${TIME_ZONE_COOKIE_NAME}=${timeZone}; path=/; max-age=${TIME_ZONE_COOKIE_MAX_AGE}; SameSite=Lax`
}

function getGeoTimeZone() {
  const cf = getRequest().cf
  const timezone = cf && 'timezone' in cf ? cf.timezone : undefined

  return typeof timezone === 'string' ? timezone : undefined
}

function resolveTimeZone(timeZone?: string) {
  try {
    return Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}
