'use client'

import type * as React from 'react'
import { composeRenderProps } from 'react-aria-components/composeRenderProps'
import * as PopoverPrimitives from 'react-aria-components/Popover'
import * as TooltipPrimitives from 'react-aria-components/Tooltip'
import type { VariantProps } from 'tailwind-variants'
import { tv } from 'tailwind-variants'

const tooltipVariants = tv({
  slots: {
    content:
      `
        w-fit max-w-xs origin-(--trigger-anchor-point) rounded-md border
        bg-popover px-3 py-1.5 text-center text-xs text-fg
        shadow-(--shadow-popover,var(--shadow-md))
        transition-[transform,opacity,scale] duration-enter ease-enter
        will-change-[transform,opacity,scale] forced-color-adjust-none
        outline-none [--slide-offset:--spacing(0.5)]
        motion-reduce:transition-none
        placement-left:[--origin:translateX(var(--slide-offset))]
        placement-right:[--origin:translateX(calc(var(--slide-offset)*-1))]
        placement-top:[--origin:translateY(var(--slide-offset))]
        placement-bottom:[--origin:translateY(calc(var(--slide-offset)*-1))]
        entering:scale-95 entering:transform-(--origin) entering:opacity-0
        exiting:scale-95 exiting:transform-(--origin) exiting:opacity-0
        exiting:duration-exit exiting:ease-out
      `,
    arrow:
      `
        block
        [&>svg]:size-2.5 [&>svg]:fill-popover [&>svg]:stroke-border
        placement-left:[&>svg]:-rotate-90
        placement-right:[&>svg]:rotate-90
        placement-bottom:[&>svg]:rotate-180
      `,
  },
})

const { content, arrow } = tooltipVariants()

/* -------------------------------------------------------------------------- */
interface TooltipProps extends React.ComponentProps<
  typeof TooltipPrimitives.TooltipTrigger
> {}

const Tooltip = ({ delay = 700, closeDelay = 0, ...props }: TooltipProps) => (
  <TooltipPrimitives.TooltipTrigger
    delay={delay}
    closeDelay={closeDelay}
    {...props}
  />
)

/* -------------------------------------------------------------------------- */

interface TooltipContentProps
  extends
  React.ComponentProps<typeof TooltipPrimitives.Tooltip>,
  VariantProps<typeof tooltipVariants> {
  hideArrow?: boolean
}

function TooltipContent({
  offset = 10,
  hideArrow = false,
  className,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitives.Tooltip
      data-slot="tooltip"
      offset={offset}
      className={composeRenderProps(className, className =>
        content({ className })
      )}
      {...props}
    >
      {composeRenderProps(props.children, children => (
        <>
          {children}
          {!hideArrow && <TooltipArrow />}
        </>
      ))}
    </TooltipPrimitives.Tooltip>
  )
}

/* -------------------------------------------------------------------------- */

interface TooltipArrowProps extends React.ComponentProps<'svg'> {}

function TooltipArrow({ className }: TooltipArrowProps) {
  return (
    <PopoverPrimitives.OverlayArrow className={arrow({ className })}>
      <svg
        aria-hidden="true"
        data-slot="tooltip-arrow"
        width={10}
        height={10}
        viewBox="0 0 10 10"
      >
        <path d="M0 0 L5 5 L10 0" />
      </svg>
    </PopoverPrimitives.OverlayArrow>
  )
}

/* -------------------------------------------------------------------------- */

export type { TooltipContentProps, TooltipProps }
export { Tooltip, TooltipContent }
