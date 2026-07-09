import Main from '@/components/main'
import { Markdown } from '@/components/markdown'
import { NextArticleButton } from '@/components/next-article-button'
import { PostAvatar } from '@/components/post-avatar'
import { posts } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

type LearnPageParams = Promise<{ slug: string }>

export default function Page({ params }: { params: LearnPageParams }) {
    return (
        <Main>
            <Suspense>
                <ArticleSection params={params} />
            </Suspense>
        </Main>
    )
}

async function ArticleSection({ params }: { params: LearnPageParams }) {
    const { slug } = await params
    const post = posts.find(post => post.slug === slug)
    if (!post || !post.text) {
        notFound()
    }
    const { excerpt, text, title } = post
    const index = posts.findIndex(p => p.slug === slug)
    const next = posts.slice(index + 1).find(p => p.text)
    return (
        <article>
            <div className='prose dark:prose-invert'>
                <div className='flex gap-3 items-start'>
                    <PostAvatar
                        seed={post.slug}
                        neutral={!post.text}
                        className='h-[2.15625rem] w-[2.15625rem]'
                    />
                    <h1 className='font-serif -mb-4 font-medium text-balance'>{title}</h1>
                </div>
                <p className='text-muted text-lg font-sans'>{excerpt}</p>
            </div>
            <Markdown>{text}</Markdown>
            {next && <NextArticleButton href={`/learn/${next.slug}`} title={next.title} />}
        </article>
    )
}
