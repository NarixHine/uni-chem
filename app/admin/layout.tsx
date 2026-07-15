import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) redirect('/sign-in')

    if (session.user.role !== 'admin') redirect('/')

    return <div className='mx-auto w-full max-w-5xl px-5 pt-16 pb-24'>{children}</div>
}
