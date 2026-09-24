import { createFileRoute, Outlet } from '@tanstack/react-router'
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
  const { user } = Route.useRouteContext()
  const { sidebarOpen } = Route.useLoaderData()

  useEffect(persistTimeZone, [])

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
          flex h-12 items-center px-2
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
