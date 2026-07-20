'use client'

import { cn } from 'cnfast'
import { Button } from '@heroui/react'
import { Dock, DockIcon } from '@/components/ui/dock'
import { useRouter } from 'next/navigation'
import { ChatTeardropIcon, HouseSimpleIcon, TriangleIcon } from '@phosphor-icons/react'

const DOCK_ITEMS = [
    { label: 'Home', icon: HouseSimpleIcon, href: '/' },
    { label: 'Solve', icon: TriangleIcon, href: '/solve' },
    { label: 'Ask', icon: ChatTeardropIcon, href: '/engage' },
]

export function NavDock() {
    const router = useRouter()
    return (
        <div className='pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-6'>
            <div className='pointer-events-auto'>
                <Dock direction='middle'>
                    {DOCK_ITEMS.map(item => (
                        <DockIcon key={item.label}>
                            <Button
                                onPress={() => {
                                    router.push(item.href)
                                }}
                                variant='ghost'
                                aria-label={item.label}
                                className={cn(
                                    'size-12 rounded-full',
                                    'hover:bg-default-soft-hover/80',
                                )}
                                isIconOnly
                            >
                                <item.icon className='size-4' />
                            </Button>
                        </DockIcon>
                    ))}
                </Dock>
            </div>
        </div>
    )
}
