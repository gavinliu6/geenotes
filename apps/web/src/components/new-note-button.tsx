import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { useCreateNote } from '@/data/notes/notes.mutation'

export function NewNoteButton({ onPress, ...props }: ButtonProps) {
  const createNote = useCreateNote()

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
