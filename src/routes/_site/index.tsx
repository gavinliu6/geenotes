import { createFileRoute, redirect } from '@tanstack/react-router'

import { getSession } from '#/lib/auth.functions'

export const Route = createFileRoute('/_site/')({
  beforeLoad: async () => {
    const session = await getSession()

    if (session) {
      throw redirect({ to: '/home' })
    }

    throw redirect({ to: '/login' })
  },
  component: Home,
})

function Home() {
  return null
}
