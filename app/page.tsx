import { posts } from '@/lib/posts'
import { PostList } from './components/post-list'
import Main from '@/components/main'

export default function Home() {
    return (
        <Main className='max-w-none w-full px-0 pt-0'>
            <section className='w-full bg-foreground relative h-[clamp(5rem,calc(18vw),8rem)]'>
                <h1 className='absolute font-bold text-balance pl-[clamp(1rem,calc(10vw),10rem)] md:pl-[20vw] -bottom-[clamp(1rem,calc(4vw),2.5rem)] text-[clamp(3rem,calc(12vw),5rem)] font-sans leading-[1.1] tracking-tight mix-blend-difference contrast-[1.2] text-background'>
                    亲民反应
                </h1>
            </section>

            <div className='max-w-xl mx-auto px-5 pt-20 md:pt-28 pb-12'>
                <PostList posts={posts} />
            </div>
        </Main>
    )
}