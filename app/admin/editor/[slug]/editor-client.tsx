'use client'

import dynamic from 'next/dynamic'
import { Spinner } from '@heroui/react'

// Tiptap needs the browser (ProseMirror view, localStorage draft). Keep it
// off the server entirely so the article source stays the only thing shipped
// in the RSC payload.
const PostEditor = dynamic(
    () => import('@/components/post-editor').then(m => m.PostEditor),
    {
        ssr: false,
        loading: () => (
            <div className='flex h-64 items-center justify-center'>
                <Spinner size='md' />
            </div>
        ),
    },
)

export interface EditorClientProps {
    slug: string
    title: string
    initialContent: string
}

export function EditorClient(props: EditorClientProps) {
    return <PostEditor {...props} />
}
