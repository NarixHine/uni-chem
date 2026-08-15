import { postSections } from '@/lib/posts'
import { PostList } from './components/post-list'
import Main from '@/components/main'
import Link from 'next/link'

export default function Home() {
    return (
        <Main className='w-full'>
            <h1 className='font-serif text-[clamp(2.5rem,8vw,3.7rem)] mb-5'>
                亲<span className='text-blue-400'>民</span>反应
            </h1>
            <p className='text-[clamp(1.125rem,3vw,1.5rem)] italic tracking-tight px-2 leading-tight text-balance font-serif mb-3'>
                A <span className='text-blue-400'>student-friendly</span> introduction to Organic
                Chemistry beyond high school textbooks.
            </p>
            <p className='text-[clamp(0.9rem,2.4vw,1.2rem)] tracking-tight px-2 leading-snug text-balance font-serif'>
                本站为<span className='font-semibold'>面向普通高中生的强基化学学习</span>网站，由
                <span className='text-blue-400'>教程</span>
                <small>（未完善，慎用）</small>和
                <Link
                    className='text-blue-400 underline underline-offset-4 decoration-1'
                    href={'/engage'}
                >
                    {' '}
                    AI 助教
                </Link>
                两部分组成。本站 AI 助教搭载绘制化学图示以讲解化学原理和反应机理的独特功能。
            </p>
            <div className='max-w-xl px-2 mx-auto pt-4 md:pt-6'>
                <PostList sections={postSections} />
            </div>
        </Main>
    )
}
