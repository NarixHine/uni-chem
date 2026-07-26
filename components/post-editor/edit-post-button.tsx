'use client'

import Link from 'next/link'
import { Button } from '@heroui/react'
import { PencilSimpleIcon } from '@phosphor-icons/react'
import { authClient } from '@/lib/auth-client'
import { verifyAdmin } from '@/lib/utils'

export function EditPostButton({ slug }: { slug: string }) {
    const { data: session } = authClient.useSession()
    if (!verifyAdmin(session)) return null
    return (
        <Button
            render={props => <Link href={`/admin/editor/${slug}`} {...(props as object)} />}
            variant='ghost'
            size='sm'
            className={'-ml-2'}
        >
            <PencilSimpleIcon className='size-4' weight='bold' />
            Open in editor
        </Button>
    )
}
