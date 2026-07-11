'use client'

import Main from '@/components/main'
import { Button } from '@heroui/react'
import { ArrowFatRightIcon } from '@phosphor-icons/react'
import Link from 'next/link'

export default function NotFound() {
    return (
        <Main className='relative flex min-h-dvh flex-col items-center justify-center overflow-hidden py-32'>
            <div className='flex flex-col items-center text-center'>
                <h1 className='font-mono font-medium leading-[0.85] tracking-[-0.04em] text-[clamp(7rem,32vw,16rem)]'>
                    404
                </h1>

                <p className='text-[clamp(1.2rem,4vw,2rem)] text-balance mt-4'>本文不存在，或暂未写就。</p>

                <Button
                    render={props => <Link href='/' {...(props as object)} />}
                    size='lg'
                    className='group mt-14 gap-3 rounded-full'
                >
                    回到主界面
                    <ArrowFatRightIcon weight='fill' />
                </Button>
            </div>
        </Main>
    )
}
