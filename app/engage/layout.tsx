import { Suspense, cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listConversations as dbListConversations } from '@/db/conversations'
import { ConversationRail } from '@/components/engage/conversation-rail'
import { MobileSidebarTrigger } from '@/components/engage/mobile-sidebar-trigger'

const listConversations = cache(dbListConversations)

export default async function EngageLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        redirect('/sign-in')
    }

    return (
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 md:flex-row md:gap-12'>
            {/* Desktop sidebar */}
            <aside className='hidden w-64 shrink-0 md:block'>
                <div className='sticky top-0 flex h-dvh w-full flex-col py-8 pb-24'>
                    <Suspense fallback={<RailSkeleton />}>
                        <ConversationRailLoader userId={session.user.id} />
                    </Suspense>
                </div>
            </aside>

            {/* Mobile trigger (fixed) */}
            <MobileSidebarTrigger>
                <Suspense fallback={<RailSkeleton />}>
                    <ConversationRailLoader userId={session.user.id} />
                </Suspense>
            </MobileSidebarTrigger>

            <div className='min-h-dvh flex-1'>{children}</div>
        </div>
    )
}

async function ConversationRailLoader({ userId }: { userId: string }) {
    const conversations = await listConversations(userId)
    return <ConversationRail initial={conversations} />
}

function RailSkeleton() {
    return (
        <div className='flex h-full flex-col'>
            <div className='mb-2 flex items-center justify-between px-1'>
                <div className='h-3 w-10 animate-pulse rounded bg-default' />
                <div className='h-3 w-4 animate-pulse rounded bg-default' />
            </div>
            <div className='flex flex-col gap-1 px-1'>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className='h-7 w-full animate-pulse rounded-lg bg-default'
                        style={{ opacity: 1 - i * 0.12 }}
                    />
                ))}
            </div>
        </div>
    )
}
