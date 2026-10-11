import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { FieldError, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { TextField } from '@/components/ui/text-field'
import { useCreateFolder, useRenameFolder } from '@/data/folders/folders.mutation'
import { folderErrorMessage } from '@/utils/folders'
import { FOLDER_NAME_MAX_LENGTH, folderNameSchema } from '@/utils/schemas'

interface FolderNameDialogProps {
  mode: 'create' | 'rename'
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  folder?: { id: string, name: string } | null
}

export function FolderNameDialog({
  mode,
  isOpen,
  onOpenChange,
  folder,
}: FolderNameDialogProps) {
  const createFolder = useCreateFolder()
  const renameFolder = useRenameFolder()
  const isPending = createFolder.isPending || renameFolder.isPending
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!isOpen) return

    setName(mode === 'rename' ? folder?.name ?? '' : '')
    setError(undefined)
  }, [isOpen, mode, folder?.id, folder?.name])

  const submit = async () => {
    if (isPending) return

    const parsed = folderNameSchema.safeParse(name)

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Name is required')

      return
    }

    try {
      if (mode === 'create') {
        await createFolder.mutateAsync(parsed.data)
      } else if (folder) {
        await renameFolder.mutateAsync({ folderId: folder.id, name: parsed.data })
      }

      onOpenChange(false)
    } catch (caught) {
      setError(folderErrorMessage(
        caught,
        mode === 'create' ? 'Failed to create folder' : 'Failed to rename folder'
      ))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New folder' : 'Rename folder'}</DialogTitle>
          </DialogHeader>
          <TextField
            autoFocus
            value={name}
            onChange={(value) => {
              setName(value)
              setError(undefined)
            }}
            isInvalid={!!error}
            validationBehavior="aria"
          >
            <Label>Name</Label>
            <Input
              maxLength={FOLDER_NAME_MAX_LENGTH}
              onFocus={event => event.currentTarget.select()}
            />
            <FieldError>{error}</FieldError>
          </TextField>
          <DialogFooter>
            <Button type="button" variant="quiet" slot="close" isDisabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="inverse" isPending={isPending} isDisabled={isPending}>
              {mode === 'create' ? 'Create' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Modal>
  )
}
