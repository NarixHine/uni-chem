'use client'

import { motion } from 'motion/react'

/**
 * Centre-piece of the Engage hub: a large serif headline with a faint,
 * slowly-drifting radial glow behind it for depth without ornament.
 */
export function EngageHero() {
    return (
        <div className='relative flex flex-col items-center text-center'>
            <div
                aria-hidden
                className='pointer-events-none absolute -inset-x-24 -top-16 bottom-0 z-0 opacity-5'
                style={{
                    background:
                        'radial-gradient(closest-side, var(--foreground), transparent 75%)',
                    animation: 'engage-drift 22s ease-in-out infinite alternate',
                }}
            />
            <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                className='relative z-10 font-serif italic text-6xl leading-none tracking-tighter text-foreground md:text-7xl'
            >
                Engage with <span className='text-accent'>AI</span>
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                className='relative z-10 mt-4 max-w-md text-pretty text-base leading-relaxed text-muted'
            >
              会在黑板上画分子结构图的 AI。
            </motion.p>

            <style>{`
                @keyframes engage-drift {
                    0%   { transform: translate3d(-6%, -4%, 0) scale(1); }
                    100% { transform: translate3d(6%, 4%, 0) scale(1.08); }
                }
            `}</style>
        </div>
    )
}
