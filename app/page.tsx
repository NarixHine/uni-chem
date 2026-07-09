import { posts } from '@/lib/posts'
import { PostList } from './components/post-list'
import Main from '@/components/main'

export default function Home() {
    return (
        <Main className='max-w-none w-full px-0 pt-0'>

            <div className='max-w-xl mx-auto px-5 pt-10 md:pt-18 pb-12'>
                <PostList posts={posts} />
            </div>
        </Main>
    )
}