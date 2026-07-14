import { prisma } from '@/lib/prisma'
import type { Conversation } from '@/lib/generated/prisma/client'

export type ConversationSummary = Pick<
    Conversation,
    'id' | 'title' | 'createdAt' | 'updatedAt'
>

/**
 * List every conversation owned by a user, newest first.
 * Direct data access only — no auth/business logic here.
 */
export async function listConversations(userId: string): Promise<ConversationSummary[]> {
    return prisma.conversation.findMany({
        where: { creatorId: userId },
        select: { id: true, title: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
    })
}

/** Create a conversation for a user. `content` is the opening prompt payload. */
export async function createConversation(
    userId: string,
    title: string,
    content: unknown = null,
): Promise<Conversation> {
    return prisma.conversation.create({
        data: { title, content: content as never, creatorId: userId },
    })
}

/**
 * Rename a conversation, scoped to its owner. Returns `null` when the
 * conversation does not belong to the caller (avoids leaking existence).
 */
export async function renameConversation(
    userId: string,
    id: string,
    title: string,
): Promise<Conversation | null> {
    const owned = await prisma.conversation.findFirst({
        where: { id, creatorId: userId },
        select: { id: true },
    })
    if (!owned) return null
    return prisma.conversation.update({ where: { id }, data: { title } })
}

/** Delete a conversation, scoped to its owner. Returns whether a row was removed. */
export async function deleteConversation(userId: string, id: string): Promise<boolean> {
    const deleted = await prisma.conversation.deleteMany({
        where: { id, creatorId: userId },
    })
    return deleted.count > 0
}

/**
 * Persist the full message transcript to a conversation's `content` field.
 * Scoped to the owner — silently no-ops if the conversation doesn't belong to
 * the caller.
 */
export async function saveMessages(
    userId: string,
    id: string,
    messages: unknown,
): Promise<void> {
    const owned = await prisma.conversation.findFirst({
        where: { id, creatorId: userId },
        select: { id: true },
    })
    if (!owned) return
    await prisma.conversation.update({
        where: { id },
        data: { content: messages as never },
    })
}
