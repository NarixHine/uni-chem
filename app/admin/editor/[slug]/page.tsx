import { notFound } from 'next/navigation'
import { posts } from '@/lib/posts'
import { EditorClient } from './editor-client'
import Main from '@/components/main'

type EditorPageParams = Promise<{ slug: string }>

export default async function EditorPage({ params }: { params: EditorPageParams }) {
    const { slug } = await params
    const post = posts.find(p => p.slug === slug)
    if (!post) notFound()
    return (
        <Main>
            <EditorClient slug={post.slug} title={post.title} initialContent={post.text ?? ''} />
        </Main>
    )
}
