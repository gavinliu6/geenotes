import { CheckIcon, CopyIcon } from 'lucide-react'
import type * as React from 'react'
import { useEffect, useState } from 'react'

import { COPIED_DURATION } from '@/components/editor/copy-feedback'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

interface CopyButtonProps extends Omit<ButtonProps, 'onPress' | 'children'> {
  value: string
  onCopy?: () => void
  children?: React.ReactNode
}

export function CopyButton({ value, onCopy, children, ...props }: CopyButtonProps) {
  const [copiedAt, setCopiedAt] = useState<number>()

  useEffect(() => {
    if (copiedAt === undefined) return

    const timeout = setTimeout(() => setCopiedAt(undefined), COPIED_DURATION)

    return () => clearTimeout(timeout)
  }, [copiedAt])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      return
    }

    setCopiedAt(Date.now())
    onCopy?.()
  }

  return (
    <Button {...props} onPress={copy}>
      <span className="copy-feedback" data-copied={copiedAt !== undefined || undefined}>
        <CopyIcon />
        <CheckIcon />
      </span>
      {children}
    </Button>
  )
}
