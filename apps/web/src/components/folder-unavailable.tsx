import { Link as RouterLink } from '@tanstack/react-router'
import { FolderClosedIcon } from 'lucide-react'
import type * as React from 'react'

import { LinkButton } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'

export function FolderUnavailable() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderClosedIcon />
        </EmptyMedia>
        <EmptyTitle>Folder unavailable</EmptyTitle>
        <EmptyDescription>
          This folder doesn't exist or you don't have access to it.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <LinkButton
          variant="inverse"
          href="/notes"
          render={props => (
            <RouterLink {...(props as React.ComponentProps<'a'>)} to="/notes" search={{}} />
          )}
        >
          All notes
        </LinkButton>
      </EmptyContent>
    </Empty>
  )
}
