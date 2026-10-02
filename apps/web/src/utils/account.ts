/** First user-perceived character, so emoji and CJK names aren't split mid-glyph. */
export function getAvatarFallback(name: string) {
  const trimmed = name.trim()

  if (!trimmed) return '?'

  const [first] = new Intl.Segmenter(undefined, {
    granularity: 'grapheme',
  }).segment(trimmed)

  return first.segment.toLocaleUpperCase()
}

export function getFirstName(name: string) {
  return name.trim().split(/\s+/u)[0]
}
