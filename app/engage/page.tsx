import { ViewTransition } from 'react'
import Main from '@/components/main'
import { EngageHero } from '@/components/engage/engage-hero'
import { EngageComposer } from '@/components/engage/engage-composer'

export default function EngagePage() {
    return (
        <Main padded={false} className='flex flex-col items-center justify-center py-16'>
            <ViewTransition exit='content-exit' default='none'>
                <EngageHero />
            </ViewTransition>
            <div className='mt-10 w-full'>
                <ViewTransition name='engage-composer' share='morph' default='none'>
                    <EngageComposer />
                </ViewTransition>
            </div>
        </Main>
    )
}
