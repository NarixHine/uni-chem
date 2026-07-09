'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { PostAvatar } from '@/components/post-avatar'

export function PostList({ posts }: { posts: Post[] }) {
    return (
        <div>
            {posts.map(post => (
                <article key={post.slug} className='group py-8'>
                    <div className='flex items-start gap-3 md:gap-4'>
                        <PostAvatar seed={post.slug} />
                        <h2 className='font-serif text-2xl leading-[1.15] tracking-tight md:text-3xl text-balance'>
                            {post.text ? (
                                <Link
                                    href={`/learn/${post.slug}`}
                                    className={'decoration-1 underline-offset-4 hover:underline'}
                                >
                                    {post.title}
                                </Link>
                            ) : (
                                <span className='text-muted'>{post.title}</span>
                            )}
                        </h2>
                    </div>

                    <p className='mt-3 max-w-2xl text-lg leading-relaxed text-muted'>
                        {post.excerpt}
                    </p>
                </article>
            ))}
        </div>
    )
}
