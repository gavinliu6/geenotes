import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { isPasswordCompromised } from 'better-auth/plugins/haveibeenpwned'

import { auth } from '@/lib/auth'
import { ensureSession } from '@/lib/auth.functions'

import { selectHasPassword } from './account.server'
import { PASSWORD_COMPROMISED_ERROR, setPasswordSchema } from './schemas'

export const getPasswordStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await ensureSession()

    return { hasPassword: await selectHasPassword(session.user.id) }
  }
)

/** Better Auth only exposes `setPassword` on the server, for accounts that have no password yet. */
export const setPassword = createServerFn({ method: 'POST' })
  .validator(setPasswordSchema)
  .handler(async ({ data }) => {
    await ensureSession()

    if (await isPasswordCompromised(data.newPassword)) {
      throw new Error(PASSWORD_COMPROMISED_ERROR)
    }

    await auth.api.setPassword({
      body: { newPassword: data.newPassword },
      headers: getRequestHeaders(),
    })
  })
