import type * as React from 'react'
import { useId } from 'react'

import { cn } from '@/lib/utils'

interface SettingsSectionProps extends React.ComponentProps<'section'> {
  title: string
  badge?: React.ReactNode
  action?: React.ReactNode
}

export function SettingsSection({
  title,
  badge,
  action,
  className,
  children,
  ...props
}: SettingsSectionProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={cn('flex flex-col gap-5', className)}
      {...props}
    >
      <header className="flex min-h-10 items-center gap-2 border-b pb-3">
        <h2 id={headingId} className="font-heading text-lg font-medium">
          {title}
        </h2>
        {badge}
        {action && <div className="ml-auto">{action}</div>}
      </header>
      {children}
    </section>
  )
}
