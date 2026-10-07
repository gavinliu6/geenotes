import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'

import { ArrowWallUp } from './icons'

interface BackToTopProps {
  targetRef: React.RefObject<HTMLElement | null>
  focusTarget: () => void
}

export function BackToTop({ targetRef, focusTarget }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false)
  const scrollContainerRef = useRef<HTMLElement | Window>(null)

  useEffect(() => {
    const updateVisibility = () => {
      const container = scrollContainerRef.current
      const scrollTop = container instanceof HTMLElement
        ? container.scrollTop
        : window.scrollY

      setIsVisible(scrollTop > 320)
    }

    // The notes pane scrolls on desktop; the document scrolls on mobile.
    const updateContainer = () => {
      let parent = targetRef.current?.parentElement
      let container: HTMLElement | Window = window

      while (parent) {
        if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) {
          container = parent
          break
        }

        parent = parent.parentElement
      }

      if (container !== scrollContainerRef.current) {
        scrollContainerRef.current?.removeEventListener('scroll', updateVisibility)
        scrollContainerRef.current = container
        container.addEventListener('scroll', updateVisibility, { passive: true })
      }

      updateVisibility()
    }

    updateContainer()
    window.addEventListener('resize', updateContainer)

    return () => {
      scrollContainerRef.current?.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateContainer)
      scrollContainerRef.current = null
    }
  }, [targetRef])

  const scrollToTop = (pointerType: string) => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    // Move focus before scrolling can hide the button, for every input method.
    focusTarget()

    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: reduceMotion || pointerType === 'keyboard' ? 'instant' : 'smooth',
    })
  }

  return (
    <div
      inert={!isVisible}
      data-visible={isVisible || undefined}
      className="
        pointer-events-none fixed right-6
        bottom-[calc(--spacing(6)+env(safe-area-inset-bottom))] z-20
        translate-y-2 opacity-0 transition-[opacity,translate] duration-exit
        ease-fluid-out
        data-visible:pointer-events-auto data-visible:translate-y-0
        data-visible:opacity-100 data-visible:duration-enter
        motion-reduce:translate-y-0 motion-reduce:transition-none
      "
    >
      <Tooltip>
        <Button
          variant="outline"
          size="lg"
          isIconOnly
          aria-label="Back to top"
          onPress={event => scrollToTop(event.pointerType)}
          className="
            rounded-full bg-bg text-fg-muted shadow-md
            transition-[background-color,border-color,color,scale] duration-150
            ease-fluid-out
            hover:bg-neutral-hover hover:text-fg
            motion-reduce:transition-none
            motion-safe:pressed:scale-[0.97]
          "
        >
          <ArrowWallUp aria-hidden="true" className="size-4" />
        </Button>
        <TooltipContent placement="left">Back to top</TooltipContent>
      </Tooltip>
    </div>
  )
}
