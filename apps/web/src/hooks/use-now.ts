import { useEffect, useState } from 'react'

import { isSameCalendarDay } from '@/utils/notes'

const CHECK_INTERVAL_MS = 60_000

/**
 * Starts from the loader's timestamp so server and client render the same
 * day labels, then re-renders once the calendar day rolls over.
 */
export function useNow(loadedNow: number, timeZone: string) {
  const [rolledOver, setRolledOver] = useState(0)
  const now = Math.max(loadedNow, rolledOver)

  useEffect(() => {
    const id = setInterval(() => {
      const next = Date.now()

      if (!isSameCalendarDay(now, next, timeZone)) setRolledOver(next)
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(id)
  }, [now, timeZone])

  return new Date(now)
}

/** Like `useNow`, but also re-renders every minute, for labels such as "5m ago". */
export function useMinuteNow(loadedNow: number) {
  const [ticked, setTicked] = useState(0)

  useEffect(() => {
    const tick = () => setTicked(Date.now())

    tick()
    const id = setInterval(tick, CHECK_INTERVAL_MS)

    return () => clearInterval(id)
  }, [])

  return new Date(Math.max(loadedNow, ticked))
}
