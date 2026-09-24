'use client'

import { composeRenderProps } from 'react-aria-components/composeRenderProps'
import * as LinkPrimitives from 'react-aria-components/Link'
import type { VariantProps } from 'tailwind-variants'
import { tv } from 'tailwind-variants'

const linkVariants = tv({
  base: `
    inline-flex items-center gap-1 focus-reset transition-colors
    focus-visible:focus-ring
  `,
  variants: {
    variant: {
      default: `
        text-fg-accent
        disabled:text-(--disabled-fg,currentColor)
      `,
      quiet:
        `
          font-medium text-fg underline underline-offset-2
          disabled:text-(--disabled-fg,var(--color-fg))
        `,
      unstyled: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface LinkProps
  extends LinkPrimitives.LinkProps, VariantProps<typeof linkVariants> {}

const Link = ({ variant, ...props }: LinkProps) => {
  return (
    <LinkPrimitives.Link
      {...props}
      className={composeRenderProps(props.className, className =>
        linkVariants({ variant, className })
      )}
    />
  )
}

export type { LinkProps }
export { Link }
