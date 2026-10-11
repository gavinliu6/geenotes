import { queryOptions } from '@tanstack/react-query'

import { listFolders } from '@/utils/folders.functions'

import { folderKeys } from './keys'

export function folderListQueryOptions() {
  return queryOptions({
    queryKey: folderKeys.list(),
    queryFn: () => listFolders(),
  })
}
