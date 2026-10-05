import { FoldHorizontalIcon, UnfoldHorizontalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface NoteWidthToggleProps {
  className?: string
  isFullWidth: boolean
  onFullWidthChange: (isFullWidth: boolean) => void
}

export function NoteWidthToggle({
  className,
  isFullWidth,
  onFullWidthChange,
}: NoteWidthToggleProps) {
  const label = isFullWidth ? 'Constrain width' : 'Expand width'

  return (
    <Tooltip>
      <Button
        variant="quiet"
        size="sm"
        isIconOnly
        aria-label={label}
        className={cn(
          `
            text-fg-muted
            [@container_(width<=42rem)]:hidden
          `,
          className
        )}
        onPress={() => onFullWidthChange(!isFullWidth)}
      >
        {isFullWidth
          ? <FoldHorizontalIcon className="size-4" />
          : <UnfoldHorizontalIcon className="size-4" />}
      </Button>
      <TooltipContent
        hideArrow
        placement="bottom"
      >{label}
      </TooltipContent>
    </Tooltip>
  )
}
