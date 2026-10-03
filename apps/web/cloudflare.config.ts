import { bindings, defineConfig } from 'cf/config'

export default defineConfig({
  worker: {
    name: 'geenotes-web',
    compatibilityDate: '2026-09-18',
    compatibilityFlags: ['nodejs_compat'],
    entrypoint: '@tanstack/react-start/server-entry',
    env: {
      D1: bindings.d1({
        name: 'geenotes',
        id: '30bbcaf9-7f24-45a0-8d45-ad2f99241787',
      }),
      R2: bindings.r2({
        name: 'geenotes',
      }),
      BETTER_AUTH_URL: bindings.secret(),
      BETTER_AUTH_SECRET: bindings.secret(),
      GITHUB_CLIENT_ID: bindings.secret(),
      GITHUB_CLIENT_SECRET: bindings.secret(),
    },
  },
})
