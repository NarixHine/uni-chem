'use client'

import Link from 'next/link'
import { Button } from '@heroui/react'
import { PencilSimpleIcon } from '@phosphor-icons/react'
import { authClient } from '@/lib/auth-client'

export function EditPostButton({ slug }: { slug: string }) {
    const { data: session } = authClient.useSession()
    if (session?.user?.role !== 'admin') return null
    return (
        <div className='flex justify-start -ml-2'>
            <Button
                render={props => <Link href={`/admin/editor/${slug}`} {...(props as object)} />}
                variant='ghost'
                size='sm'
            >
                <PencilSimpleIcon className='size-4' weight='bold' />
                Open in editor
            </Button>
        </div>
    )
}
