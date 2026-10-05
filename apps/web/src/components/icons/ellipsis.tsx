import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function Ellipsis({
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
      <circle cx="12" cy="12" r="2" fill={color} />
      <circle cx="19" cy="12" r="2" fill={color} />
      <circle cx="5" cy="12" r="2" fill={color} />
    </svg>
  )
}
