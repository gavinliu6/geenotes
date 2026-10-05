import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function PageTextEdit({
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
        d="M10 21H6C5.44771 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3H18C18.5523 3 19 3.44772 19 4V11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 21.0002V18.6668L17.5 15.1668C18.1443 14.5225 19.189 14.5225 19.8333 15.1668C20.4777 15.8112 20.4777 16.8558 19.8333 17.5002L16.3333 21.0002H14Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M9 7H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 11H11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
