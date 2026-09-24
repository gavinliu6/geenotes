import type { auth } from './auth'

export type AuthSession = typeof auth.$Infer.Session
export type AuthUser = AuthSession['user']
