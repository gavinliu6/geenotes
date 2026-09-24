import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { twoFactor } from 'better-auth/plugins/two-factor'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '@/db'

export const auth = betterAuth({
  appName: 'Geenotes',
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
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
    // Has to stay last: it writes the Set-Cookie headers produced by every
    // plugin above it into the TanStack Start response.
    tanstackStartCookies(),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
})
