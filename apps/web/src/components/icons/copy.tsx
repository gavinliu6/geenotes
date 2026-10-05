import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function Copy({
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
        d="M16 18.4V9.6C16 9.03995 16 8.75992 15.891 8.54601C15.7951 8.35785 15.6422 8.20487 15.454 8.10899C15.2401 8 14.9601 8 14.4 8H5.6C5.03995 8 4.75992 8 4.54601 8.10899C4.35785 8.20487 4.20487 8.35785 4.10899 8.54601C4 8.75992 4 9.03995 4 9.6V18.4C4 18.9601 4 19.2401 4.10899 19.454C4.20487 19.6422 4.35785 19.7951 4.54601 19.891C4.75992 20 5.03995 20 5.6 20H14.4C14.9601 20 15.2401 20 15.454 19.891C15.6422 19.7951 15.7951 19.6422 15.891 19.454C16 19.2401 16 18.9601 16 18.4Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 16H18.4C18.9601 16 19.2401 16 19.454 15.891C19.6422 15.7951 19.7951 15.6422 19.891 15.454C20 15.2401 20 14.9601 20 14.4V5.6C20 5.03995 20 4.75992 19.891 4.54601C19.7951 4.35785 19.6422 4.20487 19.454 4.10899C19.2401 4 18.9601 4 18.4 4H9.6C9.03995 4 8.75992 4 8.54601 4.10899C8.35785 4.20487 8.20487 4.35785 8.10899 4.54601C8 4.75992 8 5.03995 8 5.6V8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
