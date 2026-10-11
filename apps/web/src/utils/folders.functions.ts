import { createServerFn } from '@tanstack/react-start'

import { ensureSession } from '@/lib/auth.functions'

import {
  insertFolder,
  removeFolder,
  selectFolders,
  updateFolderName
} from './folders.server'
import {
  createFolderSchema,
  deleteFolderSchema,
  renameFolderSchema
} from './schemas'

export const listFolders = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await ensureSession()

  return selectFolders(session.user.id)
})

export const createFolder = createServerFn({ method: 'POST' })
  .validator(createFolderSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    return insertFolder(session.user.id, data.name)
  })

export const renameFolder = createServerFn({ method: 'POST' })
  .validator(renameFolderSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    return updateFolderName(session.user.id, data.folderId, data.name)
  })

export const deleteFolder = createServerFn({ method: 'POST' })
  .validator(deleteFolderSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    return removeFolder(session.user.id, data.folderId, data.deleteNotes ?? false)
  })
