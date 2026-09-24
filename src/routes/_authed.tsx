import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { getSession } from '@/lib/auth.functions'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: { returnTo: location.href },
      })
    }

    return { user: session.user }
  },
  component: () => <Outlet />,
})
