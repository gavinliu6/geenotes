import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/_app/home')({
  head: () => ({
    meta: [
      {
        title: 'Home | Geenotes',
      },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div></div>
}
