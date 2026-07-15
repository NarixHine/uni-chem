'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { adminActionClient } from './safe-action'
import { auth } from '@/lib/auth'

const userIdSchema = z.string().min(1)
const roleSchema = z.enum(['admin', 'user'])

/**
 * Ban a user — revokes all their sessions. Better Auth rejects self-bans.
 */
export const banUser = adminActionClient
    .inputSchema(
        z.object({
            userId: userIdSchema,
            banReason: z.string().trim().max(200).optional(),
            banExpiresIn: z.number().int().positive().optional(),
        }),
    )
    .action(async ({ parsedInput }) => {
        const { user } = await auth.api.banUser({
            headers: await headers(),
            body: parsedInput,
        })
        return { user: sanitize(user) }
    })

/** Remove a ban, allowing the user to sign in again. */
export const unbanUser = adminActionClient
    .inputSchema(z.object({ userId: userIdSchema }))
    .action(async ({ parsedInput }) => {
        const { user } = await auth.api.unbanUser({
            headers: await headers(),
            body: { userId: parsedInput.userId },
        })
        return { user: sanitize(user) }
    })

/** Promote or demote a user. */
export const setUserRole = adminActionClient
    .inputSchema(z.object({ userId: userIdSchema, role: roleSchema }))
    .action(async ({ parsedInput }) => {
        const { user } = await auth.api.setRole({
            headers: await headers(),
            body: { userId: parsedInput.userId, role: parsedInput.role },
        })
        return { user: sanitize(user) }
    })

/** Hard-delete a user. Better Auth rejects self-removal. */
export const removeUser = adminActionClient
    .inputSchema(z.object({ userId: userIdSchema }))
    .action(async ({ parsedInput }) => {
        await auth.api.removeUser({
            headers: await headers(),
            body: { userId: parsedInput.userId },
        })
        return { userId: parsedInput.userId, deleted: true }
    })

/** Set (or reset) a user's password; creates a credential account if needed. */
export const setUserPassword = adminActionClient
    .inputSchema(
        z.object({
            userId: userIdSchema,
            newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        }),
    )
    .action(async ({ parsedInput }) => {
        await auth.api.setUserPassword({
            headers: await headers(),
            body: {
                userId: parsedInput.userId,
                newPassword: parsedInput.newPassword,
            },
        })
        return { userId: parsedInput.userId, updated: true }
    })

type AdminUser = {
    id: string
    email: string
    name: string
    image: string | null
    role: string
    banned: boolean
    banReason: string | null
    banExpires: Date | null
    emailVerified: boolean
    createdAt: Date
}

/** Trim to the fields the admin UI actually renders. */
function sanitize(user: unknown): AdminUser {
    const u = user as Record<string, unknown>
    return {
        id: String(u.id),
        email: String(u.email),
        name: String(u.name ?? ''),
        image: (u.image as string | null) ?? null,
        role: String(u.role ?? 'user'),
        banned: Boolean(u.banned),
        banReason: (u.banReason as string | null) ?? null,
        banExpires: (u.banExpires as Date | null) ?? null,
        emailVerified: Boolean(u.emailVerified),
        createdAt: new Date(u.createdAt as string),
    }
}
