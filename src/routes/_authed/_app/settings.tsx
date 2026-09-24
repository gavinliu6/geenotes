import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/_app/settings')({
  head: () => ({
    meta: [
      {
        title: 'Settings | Geenotes',
      },
    ],
  }),
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl">Settings</h1>
    </div>
  )
}
