import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { useCreateNote } from '@/data/notes/notes.mutation'
import { allNotesScope } from '@/data/notes/scope'
import type { NoteListScope } from '@/utils/schemas'

interface NewNoteButtonProps extends ButtonProps {
  scope?: NoteListScope
}

export function NewNoteButton({
  onPress,
  scope = allNotesScope,
  ...props
}: NewNoteButtonProps) {
  const createNote = useCreateNote(scope)

  return (
    <Button
      isPending={createNote.isPending}
      onPress={(event) => {
        onPress?.(event)
        createNote.mutate()
      }}
      {...props}
    />
  )
}
