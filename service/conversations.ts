'use server'

import { z } from 'zod'
import { returnValidationErrors } from 'next-safe-action'
import { authActionClient } from './safe-action'
import {
    createConversation as dbCreate,
    deleteConversation as dbDelete,
    renameConversation as dbRename,
    saveMessages as dbSaveMessages,
} from '@/db/conversations'

const idSchema = z.string().cuid()
const titleSchema = z.string().trim().min(1, 'Title is required').max(120, 'Title is too long')

/**
 * Create a new conversation. The opening prompt seeds `content` and the title
 * defaults to a trimmed slice of that prompt.
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

        const conversation = await dbCreate(userId, title, prompt ? [{ role: 'user', text: prompt }] : null)

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
 */
export const saveMessages = authActionClient
    .inputSchema(
        z.object({
            id: idSchema,
            messages: z.unknown().array(),
        }),
    )
    .action(async ({ parsedInput, ctx }) => {
        await dbSaveMessages(ctx.auth.user.id, parsedInput.id, parsedInput.messages)
        return { id: parsedInput.id, saved: true }
    })
