'use server'

import { z } from 'zod'
import { returnValidationErrors } from 'next-safe-action'
import { authActionClient } from './safe-action'
import {
    createConversation as dbCreate,
    deleteConversation as dbDelete,
    getConversationMeta as dbGetMeta,
    renameConversation as dbRename,
    saveMessages as dbSaveMessages,
} from '@/db/conversations'
import { generateConversationTitle } from '@/lib/chat/title'

const idSchema = z.string().cuid()
const titleSchema = z.string().trim().min(1, 'Title is required').max(120, 'Title is too long')

/**
 * Create a new conversation. The opening prompt is **not** persisted here —
 * it is carried via the `?prompt=` search param and fired by the chat
 * hydrator so the AI stream starts. The first assistant turn is persisted
 * later by `saveMessages` (which also generates the title).
 */
export const createConversation = authActionClient
    .inputSchema(
        z.object({
            title: titleSchema.optional(),
            prompt: z.string().trim().min(1).max(8000).optional(),
        }),
    )
    .action(async ({ parsedInput, ctx }) => {
        const userId = ctx.auth.user.id
        const prompt = parsedInput.prompt?.trim()
        const title =
            parsedInput.title?.trim() ||
            (prompt ? (prompt.length > 48 ? prompt.slice(0, 45) + '…' : prompt) : 'New conversation')

        const conversation = await dbCreate(userId, title)

        return { id: conversation.id, title: conversation.title }
    })

/**
 * Rename a conversation owned by the signed-in user.
 */
export const renameConversation = authActionClient
    .inputSchema(z.object({ id: idSchema, title: titleSchema }))
    .action(async ({ parsedInput, ctx }) => {
        const updated = await dbRename(ctx.auth.user.id, parsedInput.id, parsedInput.title)
        if (!updated) {
            returnValidationErrors(z.object({ id: z.string() }), {
                id: { _errors: ['Conversation not found'] },
            })
        }
        return { id: updated.id, title: updated.title }
    })

/**
 * Delete a conversation owned by the signed-in user.
 */
export const deleteConversation = authActionClient
    .inputSchema(z.object({ id: idSchema }))
    .action(async ({ parsedInput, ctx }) => {
        const removed = await dbDelete(ctx.auth.user.id, parsedInput.id)
        if (!removed) {
            returnValidationErrors(z.object({ id: z.string() }), {
                id: { _errors: ['Conversation not found'] },
            })
        }
        return { id: parsedInput.id, deleted: true }
    })

/**
 * Persist the full message transcript after a turn finishes streaming.
 *
 * On the first assistant turn, a concise title is generated with a small
 * model and stored, replacing the truncated-prompt placeholder so the
 * sidebar shows a meaningful label. The new title is returned so the
 * client can update the rail reactively.
 */
export const saveMessages = authActionClient
    .inputSchema(
        z.object({
            id: idSchema,
            messages: z.unknown().array(),
        }),
    )
    .action(async ({ parsedInput, ctx }) => {
        const userId = ctx.auth.user.id
        const { id, messages } = parsedInput

        const meta = await dbGetMeta(userId, id)
        const seedCount = Array.isArray(meta?.content) ? meta!.content.length : 0
        const isFirstTurn = meta !== null && seedCount <= 1

        await dbSaveMessages(userId, id, messages)

        let title: string | undefined
        if (isFirstTurn) {
            const generated = await generateConversationTitle(messages as never)
            if (generated) {
                const renamed = await dbRename(userId, id, generated)
                if (renamed) title = renamed.title
            }
        }

        return { id, saved: true, title }
    })
