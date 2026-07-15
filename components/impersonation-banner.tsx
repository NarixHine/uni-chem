'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, toast } from '@heroui/react'
import { EyeIcon, StopCircleIcon } from '@phosphor-icons/react'
import { authClient } from '@/lib/auth-client'

/**
 * Thin, top-of-page banner shown while an admin is impersonating a user.
 * Renders nothing outside an impersonation session. "Stop" returns the
 * admin to their own session and navigates back to /admin.
 */
export function ImpersonationBanner() {
    const { data: session } = authClient.useSession()
    const router = useRouter()
    const [stopping, setStopping] = useState(false)

    const impersonatingBy = session?.session?.impersonatedBy
    if (!impersonatingBy) return null

    const onStop = async () => {
        setStopping(true)
        const { error } = await authClient.admin.stopImpersonating()
        setStopping(false)
        if (error) {
            toast.danger(error.message ?? 'Failed to stop impersonating')
            return
        }
        toast.success('Back to your admin account')
        router.refresh()
        router.push('/admin')
    }

    return (
        <div className='fixed inset-x-0 top-0 z-60 flex h-10 items-center justify-center gap-3 border-b border-warning/30 bg-warning/10 px-4 backdrop-blur'>
            <EyeIcon className='size-4 text-warning-700' weight='bold' />
            <p className='text-xs font-medium text-foreground/80'>
                Impersonating{' '}
                <span className='text-foreground'>{session?.user?.name || session?.user?.email}</span>
            </p>
            <Button
                size='sm'
                variant='tertiary'
                isPending={stopping}
                onPress={onStop}
            >
                <StopCircleIcon className='size-3.5' />
                Stop
            </Button>
        </div>
    )
}
