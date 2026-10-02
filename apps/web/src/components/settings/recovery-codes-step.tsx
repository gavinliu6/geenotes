import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import { CopyButton } from './copy-button'

interface RecoveryCodesStepProps {
  title: string
  description: string
  codes: string[]
}

export function RecoveryCodesStep({
  title,
  description,
  codes,
}: RecoveryCodesStepProps) {
  const [isSaved, setIsSaved] = useState(false)
  const text = `${codes.join('\n')}\n`

  const download = () => {
    const link = document.createElement('a')

    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
    link.download = 'geenotes-recovery-codes.txt'
    link.click()
    setIsSaved(true)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <ul className="
        grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border bg-muted/50 px-4 py-3
        text-center font-mono text-[0.8125rem] tabular-nums
      "
      >
        {codes.map(code => <li key={code}>{code}</li>)}
      </ul>
      <div className="flex gap-2">
        <CopyButton value={text} size="sm" onCopy={() => setIsSaved(true)}>
          Copy
        </CopyButton>
        <Button size="sm" onPress={download}>
          <DownloadIcon />
          Download
        </Button>
      </div>
      <DialogFooter>
        <Button slot="close" variant="inverse" isDisabled={!isSaved}>
          I've saved these codes
        </Button>
      </DialogFooter>
    </>
  )
}
