import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    streamText,
    toUIMessageStream,
    type UIMessage,
} from 'ai'
import { CHAT_MODEL } from '@/lib/chat/model'
import { CONVERSE_SYSTEM_PROMPT } from '@/lib/prompts/converse'

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = streamText({
        model: CHAT_MODEL,
        instructions: CONVERSE_SYSTEM_PROMPT,
        messages: await convertToModelMessages(messages),
        reasoning: 'medium',
        providerOptions: {
            google: { thinkingConfig: { includeThoughts: true } },
        },
    })

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({ stream: result.stream, sendReasoning: true }),
    })
}
