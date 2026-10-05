import { useEffect, useState } from 'react'

import { COPIED_DURATION } from '@/components/editor/copy-feedback'
import { Check, Copy, Share, ShareFilled } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Description, Label } from '@/components/ui/field'
import { Input, InputGroup, InputGroupAddon } from '@/components/ui/input'
import { Popover } from '@/components/ui/popover'
import { Switch, SwitchControl } from '@/components/ui/switch'
import { TextField } from '@/components/ui/text-field'
import { toastManager } from '@/components/ui/toast'
import { useUpdateNoteShare } from '@/data/notes/share.mutation'
import type { Note } from '@/utils/schemas'

interface ShareNoteButtonProps {
  note: Pick<Note, 'id' | 'sharedAt'>
}

export function ShareNoteButton({ note }: ShareNoteButtonProps) {
  const isShared = note.sharedAt !== null

  return (
    <Dialog>
      <Button variant={isShared ? 'primary' : 'outline'} size="sm">
        {isShared
          ? <ShareFilled className="-mt-0.5" />
          : <Share className="-mt-0.5 text-fg-muted" />}
        Share
      </Button>
      <Popover placement="bottom end" className="w-80">
        <DialogContent
          aria-label="Share note"
          className="in-data-popover:[--dialog-padding:--spacing(4)]"
        >
          <SharePanel note={note} />
        </DialogContent>
      </Popover>
    </Dialog>
  )
}

function SharePanel({ note }: ShareNoteButtonProps) {
  const { mutate: updateShare } = useUpdateNoteShare(note.id)
  const isShared = note.sharedAt !== null

  return (
    <>
      <Switch
        size="sm"
        className="justify-between gap-4"
        isSelected={isShared}
        onChange={updateShare}
      >
        <div className="flex flex-col gap-0.5">
          <Label className="font-medium">Share to web</Label>
          <Description className="text-xs">
            Anyone with the link can view this note.
          </Description>
        </div>
        <SwitchControl />
      </Switch>
      {isShared && <ShareLinkField noteId={note.id} />}
    </>
  )
}

function ShareLinkField({ noteId }: { noteId: string }) {
  const url = `${window.location.origin}/s/${noteId}`
  const [copiedAt, setCopiedAt] = useState<number>()
  const isCopied = copiedAt !== undefined

  useEffect(() => {
    if (copiedAt === undefined) return

    const timeout = setTimeout(() => setCopiedAt(undefined), COPIED_DURATION)

    return () => clearTimeout(timeout)
  }, [copiedAt])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedAt(Date.now())
    } catch {
      toastManager.add({ type: 'error', description: 'Failed to copy link' })
    }
  }

  return (
    <TextField aria-label="Share link" value={url} isReadOnly>
      <InputGroup size="sm">
        <Input onFocus={event => event.currentTarget.select()} />
        <InputGroupAddon>
          <Button
            variant="quiet"
            size="xs"
            isIconOnly
            aria-label="Copy link"
            onPress={copyLink}
          >
            <span className="copy-feedback" data-copied={isCopied || undefined}>
              <Copy />
              <Check />
            </span>
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </TextField>
  )
}
