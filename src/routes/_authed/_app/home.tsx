import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { Greeting } from '@/components/home/greeting'
import { RecentlyVisited } from '@/components/home/recently-visited'
import { recentNoteListQueryOptions } from '@/data/notes/notes.query'
import { useMinuteNow } from '@/hooks/use-now'
import { getCollapsedHomeSections } from '@/lib/home-sections.functions'

const appRoute = getRouteApi('/_authed/_app')

export const Route = createFileRoute('/_authed/_app/home')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(recentNoteListQueryOptions())

    return { collapsedSections: getCollapsedHomeSections() }
  },
  head: () => ({
    meta: [
      {
        title: 'Home | Geenotes',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const { user } = Route.useRouteContext()
  const { timeZone, now: loadedNow } = appRoute.useLoaderData()
  const now = useMinuteNow(loadedNow)

  return (
    <div className="
      mx-auto w-full max-w-5xl px-6 pt-6 pb-16
      md:pt-20
    "
    >
      <Greeting name={user.name} now={now} timeZone={timeZone} />
      <div className="mt-10 flex flex-col gap-10">
        <RecentlyVisited now={now} timeZone={timeZone} />
      </div>
    </div>
  )
}
