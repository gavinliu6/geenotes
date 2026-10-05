import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { useEffect, useEffectEvent } from 'react'

import { cn } from '@/lib/utils'

import { createViewer } from './viewer'

interface MarkdownViewerProps {
  markdown: string
  className?: string
  /** Called once the document has rendered. */
  onReady?: () => void
}

export function MarkdownViewer(props: MarkdownViewerProps) {
  return (
    <MilkdownProvider>
      <Viewer {...props} />
    </MilkdownProvider>
  )
}

function Viewer({ markdown, className, onReady }: MarkdownViewerProps) {
  const handleReady = useEffectEvent(() => {
    onReady?.()
  })
  const { loading } = useEditor(root => createViewer(root, markdown), [markdown])

  useEffect(() => {
    if (!loading) handleReady()
  }, [loading])

  return (
    <div className={cn('flex flex-col', className)}>
      <Milkdown />
    </div>
  )
}
