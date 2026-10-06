'use client'

import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'
import * as React from 'react'
import { DismissButton } from 'react-aria/Overlay'
import { useIsHidden } from 'react-aria/private/collections/Hidden'
import { ClearPressResponder } from 'react-aria/private/interactions/PressResponder'
import { useOverlay } from 'react-aria/useOverlay'
import { OverlayTriggerStateContext } from 'react-aria-components/Dialog'
import { useOverlayTriggerState } from 'react-stately'
import { tv } from 'tailwind-variants'

const drawerVariants = tv({
  slots: {
    overlay:
      `
        fixed inset-0 isolate z-50 [--drawer-bleed:--spacing(40)]
        [--drawer-inset:0px] [--drawer-peek:24px]
      `,
    backdrop:
      `
        absolute inset-0 bg-overlay/50
        opacity-[calc(1-var(--drawer-swipe-progress,0))] backdrop-blur-sm
        transition-opacity duration-500 ease-fluid-out
        data-ending-style:opacity-0
        data-starting-style:opacity-0
        data-swiping:duration-0
      `,
    viewport: '@container-size fixed inset-0 z-10 touch-none',
    popup:
      `
        relative flex max-h-full min-h-0 w-full min-w-0 flex-col border
        border-(--overlay-border) bg-popover text-fg
        shadow-(--shadow-modal,0_-8px_24px_-12px_rgba(0,0,0,0.35))
        [transition-property:transform,box-shadow,height,background-color,margin,padding]
        duration-[calc(500ms*var(--drawer-swipe-strength,1))] ease-fluid-out
        will-change-[transform,height] outline-none
        [--drawer-scale-base:calc(max(0,1-(var(--nested-drawers,0)*0.05)))]
        [--drawer-scale:clamp(0,calc(var(--drawer-scale-base)+(0.05*var(--drawer-stack-progress))),1)]
        [--drawer-shrink:calc(1-var(--drawer-scale))]
        [--drawer-stack-offset:max(0px,calc((var(--nested-drawers,0)-var(--drawer-stack-progress))*var(--drawer-peek)))]
        [--drawer-stack-progress:clamp(0,var(--drawer-swipe-progress,0),1)]
        [interpolate-size:allow-keywords]
        data-ending-style:shadow-none
        data-nested-drawer-swiping:transition-none
        data-stacked-drawer-open:overflow-hidden
        data-starting-style:shadow-none
        data-swiping:transition-none data-swiping:select-none
      `,
    handle:
      `
        mx-auto my-2 shrink-0 cursor-drag touch-none rounded-full bg-fg/20
        select-none
        active:cursor-dragging
        orientation-horizontal:h-1.5 orientation-horizontal:w-12
        orientation-vertical:h-12 orientation-vertical:w-1.5
      `,
    swipeArea: 'fixed z-50 touch-none',
    indent:
      `
        relative z-1 min-h-screen bg-bg transition-[transform,border-radius]
        duration-500 ease-fluid-out
        data-inactive:transform-[translate3d(0,0,0)_scale(1)]
        data-inactive:rounded-none
        data-active:transform-[translate3d(0,calc(8px*(1-var(--drawer-swipe-progress,0))),0)_scale(calc(0.96+0.04*var(--drawer-swipe-progress,0)))]
        data-active:rounded-2xl
      `,
    indentBackground:
      `
        pointer-events-none fixed inset-0 z-0 bg-overlay transition-opacity
        duration-500 ease-fluid-out
        data-inactive:opacity-0
        data-active:opacity-100
      `,
  },
  variants: {
    placement: {
      top: {
        viewport: 'grid grid-rows-[auto_1fr] pb-12',
        popup:
          `
            row-start-1 max-h-[calc(100dvh-3rem)] min-h-20 w-full origin-[50%_0]
            transform-[translateY(var(--drawer-swipe-movement-y,0px))]
            rounded-b-xl border-t-0
            data-ending-style:transform-[translateY(-100%)]
            data-stacked-drawer-open:h-(--drawer-frontmost-height,var(--drawer-height,auto))
            data-stacked-drawer-open:transform-[translateY(calc(var(--drawer-swipe-movement-y,0px)+var(--drawer-stack-offset)+(var(--drawer-shrink)*var(--drawer-frontmost-height,var(--drawer-height,0px)))))_scale(var(--drawer-scale))]
            data-starting-style:transform-[translateY(-100%)]
          `,
        swipeArea: 'inset-x-0 top-0 h-8',
      },
      bottom: {
        viewport: 'grid grid-rows-[1fr_auto] overflow-visible pt-12',
        popup:
          `
            row-start-2 mb-[calc(0px-var(--drawer-bleed))]
            max-h-[calc(100dvh-3rem+var(--drawer-bleed))] min-h-20 w-full
            origin-[50%_100%]
            transform-[translateY(var(--drawer-swipe-movement-y,0px))]
            rounded-t-xl border-b-0
            pb-[calc(env(safe-area-inset-bottom,0px)+var(--drawer-bleed)+var(--drawer-keyboard-inset,0px))]
            data-ending-style:transform-[translateY(100%)]
            data-stacked-drawer-open:h-(--drawer-frontmost-height,var(--drawer-height,auto))
            data-stacked-drawer-open:transform-[translateY(calc(var(--drawer-swipe-movement-y,0px)-var(--drawer-stack-offset)-(var(--drawer-shrink)*var(--drawer-frontmost-height,var(--drawer-height,0px)))))_scale(var(--drawer-scale))]
            data-starting-style:transform-[translateY(100%)]
          `,
        swipeArea: 'inset-x-0 bottom-0 h-8',
      },
      left: {
        viewport: 'flex justify-start pe-12',
        popup:
          `
            h-full max-w-[calc(100dvw-3rem)] min-w-20 origin-right
            transform-[translateX(var(--drawer-swipe-movement-x,0px))]
            rounded-r-xl border-l-0
            data-ending-style:transform-[translateX(-100%)]
            data-stacked-drawer-open:transform-[translateX(calc(var(--drawer-swipe-movement-x,0px)+var(--drawer-stack-offset)))_scale(var(--drawer-scale))]
            data-starting-style:transform-[translateX(-100%)]
          `,
        swipeArea: 'inset-y-0 left-0 w-8',
      },
      right: {
        viewport: 'flex justify-end ps-12',
        popup:
          `
            h-full max-w-[calc(100dvw-3rem)] min-w-20 origin-left
            transform-[translateX(var(--drawer-swipe-movement-x,0px))]
            rounded-l-xl border-r-0
            data-ending-style:transform-[translateX(100%)]
            data-stacked-drawer-open:transform-[translateX(calc(var(--drawer-swipe-movement-x,0px)-var(--drawer-stack-offset)))_scale(var(--drawer-scale))]
            data-starting-style:transform-[translateX(100%)]
          `,
        swipeArea: 'inset-y-0 right-0 w-8',
      },
    },
  },
  defaultVariants: {
    placement: 'bottom',
  },
})

const {
  backdrop,
  overlay,
  popup,
  viewport,
  handle,
  swipeArea,
  indent,
  indentBackground,
} = drawerVariants()

/* -------------------------------------------------------------------------- */

type DrawerPlacement = 'top' | 'bottom' | 'left' | 'right'

const swipeDirectionMap = {
  top: 'up',
  bottom: 'down',
  left: 'left',
  right: 'right',
} satisfies Record<
  DrawerPlacement,
  DrawerPrimitive.Root.Props['swipeDirection']
>

const DrawerPlacementContext = React.createContext<DrawerPlacement>('bottom')

interface DrawerStackContextValue {
  placement: DrawerPlacement
  onStackedChange: (isStacked: boolean) => void
}

// Only a nested drawer sliding from the same edge stacks onto its parent.
const DrawerStackContext = React.createContext<DrawerStackContextValue | null>(
  null
)

type DrawerPopupRenderProps = React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>
}

function resolveClassName<TState>(
  className: string | ((state: TState) => string | undefined) | undefined,
  state: TState
) {
  return typeof className === 'function' ? className(state) : className
}

// The popup is a presentation container: the dialog semantics belong to the
// <Dialog> rendered inside it.
function DrawerPopupElement({
  'aria-describedby': _ariaDescribedBy,
  'aria-labelledby': _ariaLabelledBy,
  role: _role,
  onPointerDownCapture,
  onPointerMoveCapture,
  onPointerUpCapture,
  onPointerCancelCapture,
  placement,
  swiping,
  ...props
}: DrawerPopupRenderProps & { placement: DrawerPlacement, swiping: boolean }) {
  const pressStartRef = React.useRef<{
    pointerId: number
    x: number
    y: number
  } | null>(null)

  // Base UI marks touchstart as swiping, even for a stationary tap. Cancel
  // react-aria's press only after an actual drag, since the popup follows the
  // finger and otherwise keeps the pointer over the pressed control.
  const cancelPressOnSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pressStartRef.current
    if (!swiping || !start || start.pointerId !== event.pointerId) return

    const deltaX = Math.abs(event.clientX - start.x)
    const deltaY = Math.abs(event.clientY - start.y)
    const isHorizontal = placement === 'left' || placement === 'right'
    const distance = isHorizontal ? deltaX : deltaY
    const crossDistance = isHorizontal ? deltaY : deltaX
    if (distance < 10 || distance < crossDistance) return

    pressStartRef.current = null
    event.currentTarget.ownerDocument.dispatchEvent(new PointerEvent('pointercancel', {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
    }))
  }

  return (
    <div
      {...props}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event)
        // React portal events also reach the parent drawer. Only track a
        // press that starts inside this popup's own DOM subtree.
        if (!event.isPrimary || !event.currentTarget.contains(event.target as Node)) return
        pressStartRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        }
      }}
      onPointerMoveCapture={(event) => {
        onPointerMoveCapture?.(event)
        cancelPressOnSwipe(event)
      }}
      onPointerUpCapture={(event) => {
        onPointerUpCapture?.(event)
        cancelPressOnSwipe(event)
        if (pressStartRef.current?.pointerId === event.pointerId) pressStartRef.current = null
      }}
      onPointerCancelCapture={(event) => {
        onPointerCancelCapture?.(event)
        if (pressStartRef.current?.pointerId === event.pointerId) pressStartRef.current = null
      }}
    />
  )
}

function getInitialFocusTarget(popupElement: HTMLDivElement | null) {
  return (
    popupElement?.querySelector<HTMLElement>(
      '[role="dialog"], [role="menu"], [role="listbox"], [role="tree"], [tabindex]'
    ) ?? true
  )
}

interface DrawerProps {
  placement?: DrawerPlacement
  isOpen?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  isDismissable?: boolean
  isKeyboardDismissDisabled?: boolean
  swipeToDismiss?: boolean
  className?: DrawerPrimitive.Popup.Props['className']
  style?: DrawerPrimitive.Popup.Props['style']
  children?: React.ReactNode
}

function Drawer({
  children,
  className,
  defaultOpen,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  isOpen,
  onOpenChange,
  placement = 'bottom',
  swipeToDismiss = true,
  style,
}: DrawerProps) {
  const isHidden = useIsHidden()
  const popupRef = React.useRef<HTMLDivElement>(null)
  const contextState = React.useContext(OverlayTriggerStateContext)
  const localState = useOverlayTriggerState({
    isOpen,
    defaultOpen,
    onOpenChange,
  })
  const state
    = isOpen !== undefined || defaultOpen !== undefined || !contextState
      ? localState
      : contextState

  // Joins react-aria's overlay stack, so a tap outside dismisses only the
  // topmost layer (a nested drawer, a popover opened inside).
  useOverlay(
    { isOpen: state.isOpen, isDismissable, onClose: state.close },
    popupRef
  )

  const parentStack = React.useContext(DrawerStackContext)
  const [isStacked, setIsStacked] = React.useState(false)
  const stack = React.useMemo(
    () => ({ placement, onStackedChange: setIsStacked }),
    [placement]
  )
  const onParentStackedChange
    = parentStack?.placement === placement
      ? parentStack.onStackedChange
      : undefined

  React.useEffect(() => {
    if (!onParentStackedChange || !state.isOpen) return
    onParentStackedChange(true)
    return () => onParentStackedChange(false)
  }, [onParentStackedChange, state.isOpen])

  if (isHidden) {
    return <>{children}</>
  }

  return (
    <DrawerPlacementContext.Provider value={placement}>
      <DrawerPrimitive.Root
        open={state.isOpen}
        disablePointerDismissal
        onOpenChange={(nextOpen, eventDetails) => {
          if (
            !nextOpen
            && isKeyboardDismissDisabled
            && eventDetails.reason === 'escape-key'
          ) {
            eventDetails.cancel()
            return
          }
          if (!nextOpen && !swipeToDismiss && eventDetails.reason === 'swipe') {
            eventDetails.cancel()
            return
          }
          if (nextOpen) state.open()
          else state.close()
        }}
        swipeDirection={swipeDirectionMap[placement]}
      >
        {/* Keyboard-aware focus/scroll handling: publishes --drawer-keyboard-inset
            on the viewport while the software keyboard is open. */}
        <DrawerPrimitive.VirtualKeyboardProvider>
          <DrawerPrimitive.Portal>
            <ClearPressResponder>
              <div className={overlay()}>
                <DrawerPrimitive.Backdrop className={backdrop()} />
                <DrawerPrimitive.Viewport className={viewport({ placement })}>
                  <DrawerPrimitive.Popup
                    data-drawer=""
                    data-stacked-drawer-open={isStacked ? '' : undefined}
                    data-base-ui-swipe-ignore={swipeToDismiss ? undefined : ''}
                    initialFocus={() => getInitialFocusTarget(popupRef.current)}
                    className={state =>
                      popup({
                        placement,
                        className: resolveClassName(className, state),
                      })}
                    render={(renderProps, { swiping }) => (
                      <DrawerPopupElement {...renderProps} placement={placement} swiping={swiping} />
                    )}
                    ref={popupRef}
                    style={style}
                  >
                    <DrawerStackContext.Provider value={stack}>
                      <OverlayTriggerStateContext.Provider value={state}>
                        {isDismissable && (
                          <DismissButton onDismiss={state.close} />
                        )}
                        {children}
                        {isDismissable && (
                          <DismissButton onDismiss={state.close} />
                        )}
                      </OverlayTriggerStateContext.Provider>
                    </DrawerStackContext.Provider>
                  </DrawerPrimitive.Popup>
                </DrawerPrimitive.Viewport>
              </div>
            </ClearPressResponder>
          </DrawerPrimitive.Portal>
        </DrawerPrimitive.VirtualKeyboardProvider>
      </DrawerPrimitive.Root>
    </DrawerPlacementContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */

interface DrawerHandleProps extends React.ComponentProps<'div'> {}

function DrawerHandle({ className, ...props }: DrawerHandleProps) {
  const placement = React.useContext(DrawerPlacementContext)
  const orientation
    = placement === 'top' || placement === 'bottom' ? 'horizontal' : 'vertical'

  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-orientation={orientation}
      data-placement={placement}
      data-slot="drawer-handle"
      className={handle({ className })}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */

interface DrawerSwipeAreaProps extends DrawerPrimitive.SwipeArea.Props {}

function DrawerSwipeArea({ className, ...props }: DrawerSwipeAreaProps) {
  const placement = React.useContext(DrawerPlacementContext)

  return (
    <DrawerPrimitive.SwipeArea
      className={state =>
        swipeArea({ placement, className: resolveClassName(className, state) })}
      data-slot="drawer-swipe-area"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */

interface DrawerProviderProps extends DrawerPrimitive.Provider.Props {}

function DrawerProvider(props: DrawerProviderProps) {
  return <DrawerPrimitive.Provider {...props} />
}

/* -------------------------------------------------------------------------- */

interface DrawerIndentProps extends DrawerPrimitive.Indent.Props {}

function DrawerIndent({ className, ...props }: DrawerIndentProps) {
  return (
    <DrawerPrimitive.Indent
      className={state =>
        indent({ className: resolveClassName(className, state) })}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */

interface DrawerIndentBackgroundProps
  extends DrawerPrimitive.IndentBackground.Props {}

function DrawerIndentBackground({
  className,
  ...props
}: DrawerIndentBackgroundProps) {
  return (
    <DrawerPrimitive.IndentBackground
      className={state =>
        indentBackground({ className: resolveClassName(className, state) })}
      {...props}
    />
  )
}

export type {
  DrawerHandleProps,
  DrawerIndentBackgroundProps,
  DrawerIndentProps,
  DrawerProps,
  DrawerProviderProps,
  DrawerSwipeAreaProps
}
export {
  Drawer,
  DrawerHandle,
  DrawerIndent,
  DrawerIndentBackground,
  DrawerProvider,
  DrawerSwipeArea
}
