import { useQuery } from '@tanstack/react-query'
import { CheckIcon, FolderIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Modal } from '@/components/ui/modal'
import { folderListQueryOptions } from '@/data/folders/folders.query'
import { useMoveNote } from '@/data/notes/notes.mutation'
import { useCurrentNoteScope } from '@/data/notes/scope'
import { folderErrorMessage } from '@/utils/folders'

interface MoveNoteDialogProps {
  note: { id: string, folderId: string | null }
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function MoveNoteDialog({ note, isOpen, onOpenChange }: MoveNoteDialogProps) {
  const { data: folders = [] } = useQuery(folderListQueryOptions())
  const moveNote = useMoveNote(note.id)
  const scope = useCurrentNoteScope()
  const [error, setError] = useState<string>()

  const choose = async (folderId: string) => {
    if (moveNote.isPending) return

    setError(undefined)

    try {
      await moveNote.mutateAsync({ noteId: note.id, folderId, scope })
      onOpenChange(false)
    } catch (caught) {
      setError(folderErrorMessage(caught, 'Failed to move note'))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) setError(undefined)
        onOpenChange(open)
      }}
      isDismissable={!moveNote.isPending}
      isKeyboardDismissDisabled={moveNote.isPending}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
          <DialogDescription>
            {folders.length > 0
              ? 'Choose a folder for this note.'
              : 'No folders yet. Create one with Add folder in the sidebar.'}
          </DialogDescription>
        </DialogHeader>
        {folders.length > 0 && (
          <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto" aria-label="Folders">
            {folders.map((folder) => {
              const selected = note.folderId === folder.id

              return (
                <li key={folder.id}>
                  <Button
                    variant="quiet"
                    className="w-full justify-start px-2"
                    isDisabled={moveNote.isPending}
                    aria-pressed={selected}
                    onPress={() => void choose(folder.id)}
                  >
                    <FolderIcon />
                    <span className="min-w-0 flex-1 truncate text-left">{folder.name}</span>
                    {selected && <CheckIcon className="ml-auto text-fg-muted" />}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
        {error && <p className="text-sm text-fg-danger">{error}</p>}
        <DialogFooter>
          <Button variant="quiet" slot="close" isDisabled={moveNote.isPending}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Modal>
  )
}
