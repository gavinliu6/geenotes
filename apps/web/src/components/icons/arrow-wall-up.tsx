import type { ComponentProps } from 'react'

import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function ArrowWallUp({
  size = 24,
  color = 'currentColor',
  className,
  ...props
}: IconProps & ComponentProps<'svg'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block', className)}
      {...props}
    >
      <path
        d="M16.25 10.9999L12.5303 7.28022C12.2375 6.98732 11.7626 6.98732 11.4697 7.28022L7.75 10.9999"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 21V7.25"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 3H5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
