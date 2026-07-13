import Main from '@/components/main'
import { Chat } from '@/components/chat'

type ChatPageParams = Promise<{ id: string }>

export default async function ChatPage({ params }: { params: ChatPageParams }) {
    const { id } = await params
    return (
        <Main className='w-full'>
            <Chat id={id} />
        </Main>
    )
}
