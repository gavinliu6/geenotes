'use client'

import type React from 'react'
import { composeRenderProps } from 'react-aria-components/composeRenderProps'
import * as PopoverPrimitives from 'react-aria-components/Popover'
import { useSlottedContext } from 'react-aria-components/slots'
import { tv } from 'tailwind-variants'

import { Drawer, DrawerHandle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

const popoverVariants = tv({
  slots: {
    popover:
      `
        popover z-50 min-w-[max(var(--trigger-width),--spacing(32))]
        origin-(--trigger-anchor-point) rounded-lg border
        border-(--overlay-border) bg-popover/(--popover-alpha)
        shadow-(--shadow-popover,var(--shadow-md))
        transition-[transform,opacity,scale] duration-enter ease-enter
        will-change-[transform,opacity,scale] forced-color-adjust-none
        outline-none [--slide-offset:--spacing(0.5)]
        [--surface-radius:var(--radius-lg)]
        before:pointer-events-none before:absolute before:inset-0 before:-z-1
        before:rounded-[inherit]
        before:[backdrop-filter:var(--popover-backdrop-filter)]
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
        block hidden
        placement-left:-ml-px
        placement-right:-mr-px
        placement-top:-mt-px
        placement-bottom:-mb-px
        [&>svg]:size-2.5 [&>svg]:fill-popover [&>svg]:stroke-border
        placement-left:[&>svg]:-rotate-90
        placement-right:[&>svg]:rotate-90
        placement-bottom:[&>svg]:rotate-180
      `,
  },
})

const { popover, arrow } = popoverVariants()

interface PopoverProps extends React.ComponentProps<
  typeof PopoverPrimitives.Popover
> {
  showArrow?: boolean
}
function Popover({
  className,
  showArrow = true,
  placement,
  ...props
}: PopoverProps) {
  const context = useSlottedContext(PopoverPrimitives.PopoverContext)
  const isMobile = useIsMobile()

  // Below the mobile line, pickers and menus slide into a bottom drawer and
  // submenus stack as nested drawers. Other non-modal popovers (a combobox
  // list) keep their anchor: the page under them stays live. Render-prop
  // children read placement and entering state, which only the popover can
  // provide.
  const isNonModal = props.isNonModal ?? context?.isNonModal
  const isSubmenu = context?.trigger === 'SubmenuTrigger'
  if (
    isMobile
    && (!isNonModal || isSubmenu)
    && typeof props.children !== 'function'
  ) {
    return (
      <Drawer
        isOpen={props.isOpen}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
      >
        <DrawerHandle />
        {props.children}
      </Drawer>
    )
  }

  return (
    <PopoverPrimitives.Popover
      data-popover=""
      className={composeRenderProps(className, className =>
        popover({ className })
      )}
      placement={placement}
      {...props}
    >
      {composeRenderProps(props.children, children => (
        <>
          {children}
          {showArrow && <PopoverArrow />}
        </>
      ))}
    </PopoverPrimitives.Popover>
  )
}

interface PopoverArrowProps extends React.ComponentProps<'svg'> {}
function PopoverArrow({ className, ...props }: PopoverArrowProps) {
  return (
    <PopoverPrimitives.OverlayArrow
      data-slot="popover-arrow"
      className={arrow({ className })}
    >
      <svg
        aria-hidden="true"
        width={12}
        height={12}
        viewBox="0 0 8 8"
        {...props}
      >
        <path d="M0 0 L4 4 L8 0" />
      </svg>
    </PopoverPrimitives.OverlayArrow>
  )
}

export type { PopoverProps }
export { Popover }
