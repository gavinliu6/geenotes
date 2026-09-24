import type { NoteListItem } from '@/utils/schemas'

export type NoteDateField = 'createdAt' | 'updatedAt'

export interface NoteDateGroup<T> {
  label: string
  /** Formats a note's date with whatever detail the group label leaves out. */
  format: Intl.DateTimeFormat
  notes: T[]
}

export function getDisplayTitle(title?: string) {
  return title?.trim() || 'Untitled note'
}

const DAY_MS = 86_400_000
const formatters = new Map<string, ReturnType<typeof createFormatters>>()

export function formatNoteTime(date: Date, timeZone: string, now: Date) {
  const { days, day, today, format } = compareDays(date, timeZone, now)

  if (days === 0) return format.time.format(date)
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return format.weekday.format(date)

  return (day.year === today.year ? format.monthDay : format.fullDate).format(
    date
  )
}

/** Buckets notes the way Apple Notes does. `notes` must already be sorted by `field`. */
export function groupNotesByDate<T extends NoteListItem>(
  notes: T[],
  field: NoteDateField,
  timeZone: string,
  now: Date
) {
  const groups: NoteDateGroup<T>[] = []

  for (const note of notes) {
    const { label, format } = getDateGroup(note[field], timeZone, now)
    const last = groups.at(-1)

    if (last?.label === label) last.notes.push(note)
    else groups.push({ label, format, notes: [note] })
  }

  return groups
}

export function isSameCalendarDay(a: Date | number, b: Date | number, timeZone: string) {
  const { calendar } = getFormatters(timeZone)

  return toCalendarDay(a, calendar).index === toCalendarDay(b, calendar).index
}

function getDateGroup(date: Date, timeZone: string, now: Date) {
  const { days, day, today, format } = compareDays(date, timeZone, now)

  if (days <= 0) return { label: 'Today', format: format.time }
  if (days === 1) return { label: 'Yesterday', format: format.time }
  if (days < 7) return { label: 'Previous 7 days', format: format.monthDay }
  if (days < 30) return { label: 'Previous 30 days', format: format.monthDay }
  if (day.year === today.year) {
    return { label: format.month.format(date), format: format.monthDay }
  }

  return { label: String(day.year), format: format.fullDate }
}

function compareDays(date: Date, timeZone: string, now: Date) {
  const format = getFormatters(timeZone)
  const day = toCalendarDay(date, format.calendar)
  const today = toCalendarDay(now, format.calendar)

  return { format, day, today, days: today.index - day.index }
}

function getFormatters(timeZone: string) {
  let entry = formatters.get(timeZone)

  if (!entry) {
    entry = createFormatters(timeZone)
    formatters.set(timeZone, entry)
  }

  return entry
}

function createFormatters(timeZone: string) {
  return {
    time: new Intl.DateTimeFormat('en-US', { timeZone, timeStyle: 'short' }),
    weekday: new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }),
    month: new Intl.DateTimeFormat('en-US', { timeZone, month: 'long' }),
    monthDay: new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'numeric',
      day: 'numeric',
    }),
    fullDate: new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    }),
    calendar: new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }),
  }
}

function toCalendarDay(date: Date | number, format: Intl.DateTimeFormat) {
  const parts = format.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(part => part.type === type)?.value)
  const year = get('year')

  return { year, index: Date.UTC(year, get('month') - 1, get('day')) / DAY_MS }
}
