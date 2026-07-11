'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { PostAvatar } from '@/components/post-avatar'
import { Markdown } from '@/components/markdown'

function PostEntry({ post }: { post: Post }) {
    return (
        <article key={post.slug} className='group py-8'>
            <div className='flex items-start gap-3'>
                <PostAvatar
                    className='h-[1.725rem] w-[1.725rem] md:h-[2.15625rem] md:w-[2.15625rem]'
                    seed={post.slug}
                    neutral={!post.text}
                />
                <h2 className='font-serif text-2xl leading-tight tracking-tight md:text-3xl text-balance'>
                    {post.text ? (
                        <Link
                            href={`/learn/${post.slug}`}
                            className={'underline-offset-4 hover:underline'}
                        >
                            {post.title}
                        </Link>
                    ) : (
                        <span className='text-muted'>{post.title}</span>
                    )}
                </h2>
            </div>

            <div className='mt-3 max-w-2xl text-lg text-muted'>
                <Markdown className='leading-relaxed'>{post.excerpt}</Markdown>
            </div>
        </article>
    )
}

function SectionHeader({ subtitle }: { subtitle: string }) {
    return (
        <div className='flex items-center gap-4 py-4'>
            <h2 className='font-serif text-xl font-medium tracking-tight whitespace-nowrap'>
                {subtitle}
            </h2>
            <div className='h-px flex-1 bg-border' />
        </div>
    )
}

export function PostList({ sections }: { sections: { subtitle: string; posts: Post[] }[] }) {
    return (
        <div>
            {sections.map((section, i) => (
                <section key={i}>
                    <SectionHeader subtitle={section.subtitle} />
                    {section.posts.map(post => (
                        <PostEntry key={post.slug} post={post} />
                    ))}
                </section>
            ))}
        </div>
    )
}
