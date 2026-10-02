import { getRouteApi } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { ChevronDownIcon } from 'lucide-react'
import type * as React from 'react'
import { useId } from 'react'
import { Disclosure, DisclosurePanel } from 'react-aria-components/Disclosure'
import { Heading } from 'react-aria-components/Heading'

import { Button } from '@/components/ui/button'
import { persistHomeSectionCollapsed } from '@/lib/home-sections.functions'

const homeRoute = getRouteApi('/_authed/_app/home')

interface HomeSectionProps {
  id: string
  title: string
  icon: LucideIcon
  className?: string
  children: React.ReactNode
}

export function HomeSection({
  id,
  title,
  icon: Icon,
  className,
  children,
}: HomeSectionProps) {
  const headingId = useId()
  const { collapsedSections } = homeRoute.useLoaderData()

  return (
    <section aria-labelledby={headingId} className={className}>
      <Disclosure
        defaultExpanded={!collapsedSections.includes(id)}
        onExpandedChange={isExpanded =>
          persistHomeSectionCollapsed(id, !isExpanded)}
        className="group/section"
      >
        <Heading id={headingId} level={2} className="flex">
          <Button
            slot="trigger"
            variant="quiet"
            size="sm"
            className="gap-2 px-2 text-sm"
          >
            <Icon className="size-4 text-fg-muted" />
            {title}
            <ChevronDownIcon className="
              size-3.5 -rotate-90 text-fg-muted transition-transform
              duration-250 ease-fluid-out
              group-expanded/section:rotate-0
            "
            />
          </Button>
        </Heading>
        <DisclosurePanel className="
          h-(--disclosure-panel-height) overflow-y-clip duration-250
          ease-fluid-out
          motion-safe:transition-[height]
        "
        >
          <div className="pt-2">{children}</div>
        </DisclosurePanel>
      </Disclosure>
    </section>
  )
}
