import Main from '@/components/main'
import { Chat } from '@/components/chat'

type ChatPageParams = Promise<{ id: string }>
type ChatPageSearch = Promise<{ prompt?: string }>

export default async function ChatPage({
    params,
    searchParams,
}: {
    params: ChatPageParams
    searchParams: ChatPageSearch
}) {
    const { id } = await params
    const { prompt } = await searchParams
    return (
        <Main padded={false} className='pt-8'>
            <Chat id={id} initialPrompt={prompt} />
        </Main>
    )
}
