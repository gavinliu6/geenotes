import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function Check({
  size = 24,
  color = 'currentColor',
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block', className)}
    >
      <path d="M5 12.75L10 19L19 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
