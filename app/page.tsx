import Link from 'next/link'
import { posts } from '@/lib/posts'
import { PostList } from './components/post-list'
import Main from '@/components/main'

export default function Home() {
    return (
        <Main>
            <header className='sticky top-0 z-50 border-b border-[var(--border)] bg-background/80 backdrop-blur-md'>
                <div className='mx-auto flex max-w-5xl items-center justify-between px-6 py-4'>
                    <Link href='/' className='font-mono text-sm tracking-tight'>
                        uni-chem<span className='text-muted'>/notes</span>
                    </Link>
                </div>
            </header>

            <section className='py-24 md:py-32'>
                <h1 className='mt-6 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl'>
                  Organic Chemistry
                </h1>
                <p className='mt-8 max-w-xl text-lg leading-relaxed text-muted'>
                  高中化学教科书的延伸
                </p>
            </section>

            <section className='pb-32'>
                <div className='flex items-baseline justify-between border-t border-[var(--border)] py-6'>
                    <h2 className='font-mono text-xs uppercase tracking-[0.15em] text-muted'>
                        Index — {posts.length} essays
                    </h2>
                </div>
                <PostList posts={posts} />
            </section>
        </Main>
    )
}
