import { prisma } from '@/lib/prisma'
import type { Conversation } from '@/lib/generated/prisma/client'
import type { UIMessage } from 'ai'

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
 * Fetch the `content` + `title` of an owned conversation. Used by the service
 * layer to detect whether a save is the first assistant turn (content is
 * still `null` or holds fewer than 2 messages).
 */
export async function getConversationMeta(
    userId: string,
    id: string,
): Promise<{ title: string; content: unknown } | null> {
    const row = await prisma.conversation.findFirst({
        where: { id, creatorId: userId },
        select: { title: true, content: true },
    })
    return row ?? null
}

/**
 * Load a conversation's message transcript as normalized `UIMessage[]`.
 *
 * The `content` column is written by `saveMessages` as full `UIMessage[]`.
 * Returns `null` when the conversation is missing or has no messages yet
 * (a freshly-created conversation has `content = null` — its opening prompt
 * is fired client-side via the `?prompt=` search param).
 */
export async function getConversationMessages(
    userId: string,
    id: string,
): Promise<UIMessage[] | null> {
    const meta = await getConversationMeta(userId, id)
    const content = meta?.content
    if (!Array.isArray(content) || content.length === 0) return null
    return content
        .map(normalizeUIMessage)
        .filter((m): m is UIMessage => m !== null)
}

type StoredMessage = {
    id?: string
    role?: string
    text?: string
    parts?: unknown[]
}

function normalizeUIMessage(raw: unknown): UIMessage | null {
    if (typeof raw !== 'object' || raw === null) return null
    const m = raw as StoredMessage
    const role: UIMessage['role'] =
        m.role === 'assistant' || m.role === 'system' ? m.role : 'user'
    if (Array.isArray(m.parts) && m.parts.length > 0) {
        return {
            id: m.id ?? crypto.randomUUID(),
            role,
            parts: m.parts as UIMessage['parts'],
        }
    }
    if (typeof m.text === 'string') {
        return {
            id: m.id ?? crypto.randomUUID(),
            role,
            parts: [{ type: 'text', text: m.text }],
        }
    }
    return null
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
