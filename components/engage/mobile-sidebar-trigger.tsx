'use client'

import { type ReactNode, useEffect } from 'react'
import { Drawer, Button, useOverlayState } from '@heroui/react'
import { ListIcon } from '@phosphor-icons/react/ssr'
import { usePathname } from 'next/navigation'

/**
 * Floating menu button visible only below the rail breakpoint (60rem).
 * The drawer is controlled via useOverlayState and auto-dismisses whenever
 * the route changes so selecting a conversation closes the panel.
 */
export function MobileSidebarTrigger({ children }: { children: ReactNode }) {
    const state = useOverlayState()
    const { close } = state
    const pathname = usePathname()

    // Dismiss the drawer on navigation (e.g. opening/creating a conversation).
    useEffect(() => {
        close()
    }, [pathname, close])

    return (
        <div className='fixed left-3 top-3 z-40 rail:hidden'>
            <Drawer state={state}>
                <Button
                    isIconOnly
                    variant='ghost'
                    aria-label='打开对话列表'
                    className='size-9 rounded-lg border border-border/60 bg-surface/70 backdrop-blur-xl'
                    style={{
                        boxShadow:
                            'inset 0 0.5px 0.5px rgba(255,255,255,0.45), 0 1px 2px rgba(0,0,0,0.04), 0 8px 20px -10px rgba(0,0,0,0.10)',
                    }}
                >
                    <ListIcon className='size-5' weight='regular' />
                </Button>
                <Drawer.Backdrop className={'bg-transparent'}>
                    <Drawer.Content
                        placement='left'
                        className='bg-transparent shadow-none data-entering:shadow-none data-exiting:shadow-none'
                    >
                        <Drawer.Dialog className='bg-transparent p-3 shadow-none'>
                            {children}
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </Drawer>
        </div>
    )
}
