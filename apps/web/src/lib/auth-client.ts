import { twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // Neither `twoFactorPage` nor `onTwoFactorRedirect` is set, because both
  // navigate outside of TanStack Router. Sign-in resolves with
  // `data.twoFactorRedirect === true` instead, and the caller navigates.
  plugins: [twoFactorClient()],
})
