import { headers } from 'next/headers'
import { forbidden, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { verifyAdmin } from '@/lib/utils'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) redirect('/sign-in')

    if (!verifyAdmin(session)) forbidden()

    return <div className='mx-auto w-full max-w-5xl px-5 pt-16 pb-24'>{children}</div>
}
