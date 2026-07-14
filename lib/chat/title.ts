import { convertToModelMessages, generateText, type UIMessage } from 'ai'
import { TITLE_MODEL } from './model'

const TITLE_INSTRUCTIONS = `
You generate a concise conversation title (max 6 words) from a chemistry-student chat.
Rules:
- Reply with ONLY the title text. No quotes, no trailing punctuation, no explanation.
- Use the same language as the user's message (Chinese if they wrote Chinese).
- Capture the core topic, not a verbatim copy of the question.
- If the user only sent an image, describe its chemistry subject concisely (e.g. "反应机理图示").
- Never prefix with "Title:" or similar.
`.trim()

/**
 * Generate a concise conversation title from the opening user message,
 * including image-only messages (the flash-lite model is vision-capable).
 * Returns `null` when there is no usable content or the model call fails so
 * callers can fall back to the truncated-prompt placeholder.
 */
export async function generateConversationTitle(messages: UIMessage[]): Promise<string | null> {
    try {
        const modelMessages = await convertToModelMessages(messages as never)
        const firstUser = modelMessages.find(m => m.role === 'user')
        if (!firstUser) return null

        const { text } = await generateText({
            model: TITLE_MODEL,
            instructions: TITLE_INSTRUCTIONS,
            messages: [{ role: 'user', content: firstUser.content }],
        })
        const cleaned = text.trim().replace(/^["'`]|["'`]$/g, '').trim()
        return cleaned || null
    } catch {
        return null
    }
}
