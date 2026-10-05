import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function Pencil({
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
        d="M15 4L4.7266 14.2734C4.57923 14.4208 4.48158 14.6105 4.44732 14.8161L3.5 20.5L9.1839 19.5527C9.38948 19.5184 9.57923 19.4208 9.7266 19.2734L20 9C21.3807 7.61929 21.3807 5.38071 20 4C18.6193 2.61929 16.3807 2.61929 15 4Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 5.5L18.5 10.5"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  )
}
