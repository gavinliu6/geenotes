import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppSidebar } from '@/components/layouts/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { getSidebarState, persistSidebarState } from '@/lib/sidebar.functions'
import { getTimeZone, persistTimeZone } from '@/lib/timezone.functions'

export const Route = createFileRoute('/_authed/_app')({
  loader: () => ({
    sidebarOpen: getSidebarState(),
    timeZone: getTimeZone(),
    now: Date.now(),
  }),
  component: AppLayout,
})

function AppLayout() {
  const router = useRouter()
  const { user } = Route.useRouteContext()
  const { sidebarOpen, timeZone } = Route.useLoaderData()

  useEffect(() => {
    persistTimeZone()

    if (timeZone !== getTimeZone()) {
      void router.invalidate({ filter: match => match.routeId === Route.id })
    }
  }, [router, timeZone])

  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      onOpenChange={persistSidebarState}
      className="md:h-svh"
    >
      <AppSidebar user={user} />
      <SidebarInset className="md:overflow-y-auto">
        {/* Below `md` the sidebar is a drawer, so the page needs its own opener. */}
        <header className="
          flex h-12 items-center px-6
          md:hidden
        "
        >
          <SidebarTrigger />
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
