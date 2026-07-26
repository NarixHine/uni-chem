import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from './prisma'

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        requireEmailVerification: false,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    plugins: [
        admin(),
        // Must be last — lets Server Actions set cookies (sign-in, sign-up).
        nextCookies(),
    ],
})

export type Session = typeof auth.$Infer.Session

export function verifyAdmin(
    sessionOrUser: Session | Session['user'] | null | undefined,
): boolean {
    if (!sessionOrUser) return false
    const user = 'user' in sessionOrUser ? sessionOrUser.user : sessionOrUser
    return user?.role === 'admin'
}
