'use client'

import Link from 'next/link'
import { Button } from '@heroui/react'

export function NextArticleButton({ href, title }: { href: string; title: string }) {
    return (
        <Button
            render={props => <Link href={href} {...(props as object)} />}
            variant='ghost'
            size='lg'
            className='mt-12 min-h-18 justify-start -mx-4 w-[calc(100%+2rem)]'
        >
            <span className='flex flex-col items-start gap-0.5'>
                <span className='text-muted text-sm'>下一节</span>
                <span className='font-serif text-xl'>{title}</span>
            </span>
        </Button>
    )
}
