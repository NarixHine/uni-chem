import { posts } from '@/lib/posts'
import { PostList } from './components/post-list'
import Main from '@/components/main'

export default function Home() {
    return (
        <Main className='w-full'>
            <h1 className='font-serif text-[clamp(2.5rem,8vw,3.7rem)] mb-5'>
                亲<span className='text-blue-400'>民</span>反应
            </h1>
            <p className='text-[clamp(1.125rem,3vw,1.5rem)] italic tracking-tight px-2 leading-tight text-balance font-serif'>
                A <span className='text-blue-400'>student-friendly</span> introduction to Organic Chemistry beyong high school textbooks.
            </p>
            <div className='max-w-xl px-2 mx-auto pt-4 md:pt-6'>
                <PostList posts={posts} />
            </div>
        </Main>
    )
}
