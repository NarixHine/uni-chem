import { createSafeActionClient } from 'next-safe-action'
import { betterAuth } from '@next-safe-action/adapter-better-auth'
import { DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action'
import { auth } from '@/lib/auth'

/**
 * Base client — public actions. Server errors are surfaced as a plain string
 * for the client (`result.serverError`).
 */
export const actionClient = createSafeActionClient({
    handleServerError: error => {
        console.error('Safe action error:', error)
        return error instanceof Error ? error.message : DEFAULT_SERVER_ERROR_MESSAGE
    },
})

/**
 * Authenticated client — injects a typed Better Auth session and rejects
 * unauthenticated requests via `unauthorized()` from `next/navigation`.
 * Context: `ctx.auth.user` and `ctx.auth.session`.
 */
export const authActionClient = actionClient.use(betterAuth(auth))
