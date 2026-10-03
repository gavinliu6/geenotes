import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { haveIBeenPwned } from 'better-auth/plugins/haveibeenpwned'
import { twoFactor } from 'better-auth/plugins/two-factor'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from 'cloudflare:workers'

import { db } from '@/db'
import {
  newPasswordSchema,
  PASSWORD_COMPROMISED_ERROR,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH
} from '@/utils/schemas'

export const auth = betterAuth({
  appName: 'Geenotes',
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },
  user: {
    additionalFields: {
      status: {
        type: ['waiting', 'active', 'suspended'],
        required: true,
        defaultValue: 'waiting',
        input: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/change-password') return

      const result = newPasswordSchema.safeParse(ctx.body?.newPassword)

      if (!result.success) {
        throw new APIError('BAD_REQUEST', {
          message: result.error.issues[0]?.message,
        })
      }
    }),
  },
  advanced: {
    ipAddress: {
      // Cloudflare terminates the connection at its edge and overwrites this
      // header, so it is the only client IP a Worker can trust. Miniflare sets
      // it during local dev as well.
      ipAddressHeaders: ['cf-connecting-ip'],
    },
  },
  plugins: [
    twoFactor({
      // Shown as the account name in authenticator apps.
      issuer: 'Geenotes',
      // `otpOptions.sendOTP` is deliberately left out: there is no mail
      // provider yet, so an authenticator app plus backup codes are the only
      // second factors. Adding `sendOTP` later is what turns email OTP on.
      totpOptions: {
        digits: 6,
        period: 30,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        // Encrypted with BETTER_AUTH_SECRET, so a database leak alone doesn't
        // hand over usable recovery codes.
        storeBackupCodes: 'encrypted',
      },
    }),
    haveIBeenPwned({
      paths: ['/change-password'],
      customPasswordCompromisedMessage: PASSWORD_COMPROMISED_ERROR,
    }),
    // Has to stay last: it writes the Set-Cookie headers produced by every
    // plugin above it into the TanStack Start response.
    tanstackStartCookies(),
  ],
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
})
