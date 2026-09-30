import { createFileRoute } from '@tanstack/react-router'

import { ChangePasswordSection } from '@/components/settings/change-password-section'
import { ProfileSection } from '@/components/settings/profile-section'
import { TwoFactorSection } from '@/components/settings/two-factor-section'
import { getPasswordStatus } from '@/utils/account.functions'

export const Route = createFileRoute('/_authed/_app/settings')({
  loader: () => getPasswordStatus(),
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
  const { user } = Route.useRouteContext()
  const { hasPassword } = Route.useLoaderData()

  return (
    <div className="
      mx-auto w-full max-w-2xl px-6 pt-6 pb-16
      md:pt-12
    "
    >
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        Settings
      </h1>
      <div className="mt-10 flex flex-col gap-12">
        <ProfileSection user={user} />
        <ChangePasswordSection email={user.email} hasPassword={hasPassword} />
        <TwoFactorSection
          isEnabled={!!user.twoFactorEnabled}
          hasPassword={hasPassword}
        />
      </div>
    </div>
  )
}
