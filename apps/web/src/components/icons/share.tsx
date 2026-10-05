import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function Share({
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
        d="M21.8364 11.632L13.8254 4.27052C13.5048 3.97595 12.9871 4.20334 12.9871 4.63868V8.50018C4.63119 8.50018 2.07358 11.3993 1.98926 19.5726C1.98817 19.6781 2.13044 19.7151 2.17858 19.6212C3.58704 16.8739 4.85284 15.5002 12.9871 15.5002V19.3617C12.9871 19.797 13.5048 20.0244 13.8254 19.7298L21.8364 12.3683C22.052 12.1702 22.052 11.8301 21.8364 11.632Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
