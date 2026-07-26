'use client'

import Link from 'next/link'
import { Button } from '@heroui/react'
import { PencilSimpleIcon } from '@phosphor-icons/react'

export function EditPostButton({ slug }: { slug: string }) {
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
