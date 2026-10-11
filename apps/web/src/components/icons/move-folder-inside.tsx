import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function MoveFolderInside({
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
      <path
        d="M21 11V8C21 7.44772 20.5523 7 20 7H12.5352C12.2008 7 11.8886 6.8329 11.7031 6.5547L10.2969 4.4453C10.1114 4.1671 9.79917 4 9.46482 4H4C3.44772 4 3 4.44772 3 5V18C3 18.5523 3.44772 19 4 19H11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 17H16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 14L15 17L18 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
