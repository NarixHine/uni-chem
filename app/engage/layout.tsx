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
        <div className='mx-auto flex w-full flex-col gap-2 px-5 rail:flex-row rail:gap-8 rail:pt-0'>
            {/* Desktop sidebar — floats with breathing room */}
            <aside className='hidden w-64 shrink-0 rail:block'>
                <div className='sticky top-6 h-[calc(100dvh-3rem)] py-0'>
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

            <div className='flex-1'>{children}</div>
        </div>
    )
}

async function ConversationRailLoader({ userId }: { userId: string }) {
    const conversations = await listConversations(userId)
    return <ConversationRail initial={conversations} />
}

function RailSkeleton() {
    return (
        <aside
                    className='relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface rail:bg-surface/70'
            style={{
                boxShadow:
                    'inset 0 0.5px 0.5px rgba(255,255,255,0.45), 0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -10px rgba(0,0,0,0.10)',
            }}
        >
            <div className='flex items-center justify-between px-4 pt-4 pb-2'>
                <div className='h-3 w-10 animate-pulse rounded bg-default' />
                <div className='h-4 w-4 animate-pulse rounded bg-default' />
            </div>
            <div className='flex flex-1 flex-col gap-1 px-2'>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className='h-7 w-full animate-pulse rounded-lg bg-default'
                        style={{ opacity: 1 - i * 0.12 }}
                    />
                ))}
            </div>
            <div className='mt-2 border-t border-border/40 p-2'>
                <div className='h-7 w-full animate-pulse rounded-lg bg-default' />
            </div>
        </aside>
    )
}
