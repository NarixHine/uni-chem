import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    streamText,
    toUIMessageStream,
    type UIMessage,
} from 'ai'
import { headers } from 'next/headers'
import { CHAT_MODEL } from '@/lib/chat/model'
import { CONVERSE_SYSTEM_PROMPT } from '@/lib/prompts/converse'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = streamText({
        model: CHAT_MODEL,
        instructions: CONVERSE_SYSTEM_PROMPT,
        messages: await convertToModelMessages(messages),
        reasoning: 'high',
        providerOptions: {
            google: {
                thinkingConfig: {
                    includeThoughts: true,
                },
            },
        },
    })

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({ stream: result.stream, sendReasoning: true }),
    })
}
