'use client'

import { useState, type ReactNode } from 'react'
import { Drawer, Button } from '@heroui/react'
import { ListIcon } from '@phosphor-icons/react/ssr'

/**
 * Fixed-position menu button visible only on mobile. Opens a left-side
 * Drawer containing the conversation sidebar.
 */
export function MobileSidebarTrigger({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    return (
        <div className='fixed left-4 top-4 z-50 md:hidden'>
            <Drawer isOpen={open} onOpenChange={setOpen}>
                <Drawer.Trigger>
                    <Button
                        isIconOnly
                        variant='ghost'
                        aria-label='打开对话列表'
                        className='size-10 rounded-full border border-border bg-surface'
                    >
                        <ListIcon className='size-5' />
                    </Button>
                </Drawer.Trigger>
                <Drawer.Backdrop />
                <Drawer.Content placement='left'>
                    <Drawer.Dialog>
                        <Drawer.Header>
                            <Drawer.Heading>对话</Drawer.Heading>
                        </Drawer.Header>
                        <Drawer.Body className='h-dvh pb-12'>
                            {children}
                        </Drawer.Body>
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer>
        </div>
    )
}
