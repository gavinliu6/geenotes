import { cn } from '#/lib/utils'

import type { IconProps } from './types'

export function ShareFilled({
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
        d="M11.9861 4.6387C11.9861 3.33267 13.5394 2.65052 14.5011 3.53421L22.5121 10.8957C23.1588 11.49 23.1588 12.5104 22.5121 13.1047L14.5011 20.4662C13.5394 21.3499 11.9861 20.6677 11.9861 19.3617V16.5078C8.56816 16.5618 6.66062 16.9006 5.47389 17.4406C4.2774 17.9851 3.74038 18.7649 3.06749 20.0775C2.50949 21.1659 0.977012 20.6607 0.988344 19.5623C1.03096 15.4312 1.6878 12.3157 3.66764 10.2751C5.49779 8.38876 8.2563 7.62508 11.9861 7.51453V4.6387Z"
        fill={color}
      />
    </svg>
  )
}
