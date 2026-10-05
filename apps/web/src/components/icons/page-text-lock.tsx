import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function PageTextLock({
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
        d="M14 18C14 17.4477 14.4477 17 15 17H19C19.5523 17 20 17.4477 20 18V20C20 20.5523 19.5523 21 19 21H15C14.4477 21 14 20.5523 14 20V18Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 16C15 14.8954 15.8954 14 17 14C18.1046 14 19 14.8954 19 16C19 16.5523 18.5523 17 18 17H16C15.4477 17 15 16.5523 15 16Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 21H6C5.44771 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3H18C18.5523 3 19 3.44772 19 4V10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 7H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 11H12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
