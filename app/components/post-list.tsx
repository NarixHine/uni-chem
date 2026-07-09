'use client'

import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { PostAvatar } from '@/components/post-avatar'

export function PostList({ posts }: { posts: Post[] }) {
    return (
        <div>
            {posts.map(post => (
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
