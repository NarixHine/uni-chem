'use client'

import { type ReactNode } from 'react'
import { Drawer, Button } from '@heroui/react'
import { ListIcon } from '@phosphor-icons/react/ssr'

/**
 * Floating menu button visible only on mobile. Opens an uncontrolled
 * left-side Drawer whose dialog chrome is fully transparent — it only
 * hosts the floating sidebar (which paints its own studio-lit panel),
 * so the sidebar appears to float over the page just like on desktop.
 * HeroUI manages open/close state internally; tapping the backdrop or
 * pressing Escape dismisses it.
 */
export function MobileSidebarTrigger({ children }: { children: ReactNode }) {
    return (
        <div className='fixed left-3 top-3 z-40 md:hidden'>
            <Drawer>
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
