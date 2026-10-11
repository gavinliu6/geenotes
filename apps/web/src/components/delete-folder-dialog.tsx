import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Modal } from '@/components/ui/modal'
import { useDeleteFolder } from '@/data/folders/folders.mutation'
import { folderErrorMessage } from '@/utils/folders'
import type { FolderListItem } from '@/utils/schemas'

interface DeleteFolderDialogProps {
  folder: FolderListItem | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function DeleteFolderDialog({
  folder,
  isOpen,
  onOpenChange,
}: DeleteFolderDialogProps) {
  const deleteFolder = useDeleteFolder()
  const [deleteNotes, setDeleteNotes] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!isOpen) return

    setDeleteNotes(false)
    setError(undefined)
  }, [isOpen, folder?.id])

  const submit = async () => {
    if (!folder || deleteFolder.isPending) return

    setError(undefined)

    try {
      await deleteFolder.mutateAsync({
        folderId: folder.id,
        deleteNotes,
      })
      onOpenChange(false)
    } catch (caught) {
      setError(folderErrorMessage(caught, 'Failed to delete folder'))
    }
  }

  const noteCount = folder?.noteCount ?? 0
  const helper = deleteNotes
    ? 'This folder and all notes inside it will be permanently deleted. This cannot be undone.'
    : noteCount === 0
      ? 'This folder has no notes.'
      : 'Notes stay in All notes.'

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!deleteFolder.isPending}
      isKeyboardDismissDisabled={deleteFolder.isPending}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{folder ? `Delete "${folder.name}"?` : 'Delete folder?'}</DialogTitle>
            <DialogDescription>
              {noteCount === 1 ? '1 note' : `${noteCount} notes`}
            </DialogDescription>
          </DialogHeader>
          <Checkbox
            isSelected={deleteNotes}
            onChange={setDeleteNotes}
            isDisabled={deleteFolder.isPending}
          >
            Also delete all notes in this folder
          </Checkbox>
          <p className="text-sm text-fg-muted">{helper}</p>
          {error && <p className="text-sm text-fg-danger">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="quiet"
              slot="close"
              isDisabled={deleteFolder.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isPending={deleteFolder.isPending}
              isDisabled={deleteFolder.isPending}
            >
              {deleteNotes ? 'Delete folder and notes' : 'Delete folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Modal>
  )
}
