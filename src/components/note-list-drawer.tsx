import { MenuIcon } from 'lucide-react'

import { NoteList } from '@/components/note-list'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer } from '@/components/ui/drawer'

export function NoteListDrawer() {
  return (
    <Dialog>
      <Button
        variant="quiet"
        size="sm"
        isIconOnly
        aria-label="All notes"
        className="text-fg-muted"
      >
        <MenuIcon />
      </Button>
      <Drawer placement="left" className="w-72 bg-bg">
        <DialogContent aria-label="All notes" className="flex-1 p-0">
          {({ close }) => (
            <NoteList className="min-h-0 flex-1" onNavigate={close} />
          )}
        </DialogContent>
      </Drawer>
    </Dialog>
  )
}
