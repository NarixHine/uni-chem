import Link from 'next/link'
import { posts } from '@/lib/posts'
import { PostList } from './components/post-list'
import Main from '@/components/main'

export default function Home() {
    return (
        <Main className='max-w-none w-dvw px-0'>
 
            <section className='w-dvw bg-foreground relative h-[clamp(5rem,calc(18vw),8rem)]'>
                <h1 className='absolute font-bold text-balance pl-[clamp(1rem,calc(10vw),10rem)] md:pl-[20vw] -bottom-[clamp(1rem,calc(4vw),2.5rem)] text-[clamp(3rem,calc(12vw),5rem)] font-sans leading-[1.1] tracking-tight mix-blend-difference contrast-[1.2] text-background'>
                  有机化学探微
                </h1>
            </section>

        </Main>
    )
}
