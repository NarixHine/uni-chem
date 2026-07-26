'use client'

import { XIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'

const STORAGE_KEY = 'visualizer:pinch-hint-dismissed'

/**
 * Animated pinch-gesture signifier shown at the bottom-right of a Visualizer
 * to signal that the canvas is pinch-zoomable. Plays a satisfying two-finger
 * pinch-in / release cycle a few times on mount, then fades out and unmount.
 * A "stop showing" button persists the dismissal to localStorage so it never
 * appears again for this browser.
 */
export function PinchAffordance() {
    const [dismissed, setDismissed] = useLocalStorage(STORAGE_KEY, false)
    const [visible, setVisible] = useState(!dismissed)
    useEffect(() => {
        if (dismissed) return
        const t = setTimeout(() => setVisible(false), 5200)
        return () => clearTimeout(t)
    }, [dismissed])

    if (dismissed) return null

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className='absolute bottom-7 right-7 z-10 flex items-center gap-1.5 rounded-full bg-foreground/8 py-1 pl-2.5 pr-1.5 backdrop-blur-[2px]'
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    <span className='text-[11px] font-medium tracking-wide text-foreground/60'>
                        双指缩放
                    </span>
                    <svg
                        width='22'
                        height='22'
                        viewBox='0 0 22 22'
                        fill='none'
                        className='text-foreground/60 shrink-0'
                    >
                        {/* thumb — travels right toward center */}
                        <motion.circle
                            cx='5'
                            cy='17'
                            r='2'
                            fill='currentColor'
                            style={{ x: 0 }}
                            initial={false}
                            animate={{ x: [0, 4, 0], opacity: [0.5, 1, 0.5] }}
                            transition={{
                                duration: 1.6,
                                repeat: 2,
                                ease: 'easeInOut',
                                times: [0, 0.5, 1],
                            }}
                        />
                        {/* index finger — travels left toward center */}
                        <motion.circle
                            cx='17'
                            cy='5'
                            r='2'
                            fill='currentColor'
                            style={{ x: 0 }}
                            initial={false}
                            animate={{ x: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                            transition={{
                                duration: 1.6,
                                repeat: 2,
                                ease: 'easeInOut',
                                times: [0, 0.5, 1],
                            }}
                        />
                        {/* convergence pulse at the meeting point */}
                        <motion.circle
                            cx='11'
                            cy='11'
                            r='2'
                            fill='currentColor'
                            style={{ scale: 0 }}
                            initial={false}
                            animate={{ scale: [0, 2, 0], opacity: [0, 0.4, 0] }}
                            transition={{
                                duration: 1.6,
                                repeat: 2,
                                ease: 'easeInOut',
                                times: [0, 0.5, 1],
                            }}
                        />
                    </svg>
                    <button
                        type='button'
                        onClick={() => setDismissed(true)}
                        aria-label='不再显示'
                        className='text-foreground/40 hover:text-foreground/70 grid size-4 shrink-0 place-items-center rounded-md transition-colors'
                    >
                        <XIcon className='size-3' />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
