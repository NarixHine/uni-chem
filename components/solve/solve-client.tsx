'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@heroui/react'
import { ArrowRightIcon } from '@phosphor-icons/react'
import { PROBLEMS } from '@/lib/problems'
import { Markdown } from '@/components/markdown'
import { Whiteboard } from './whiteboard'

export function SolveClient({ initialIndex }: { initialIndex: number }) {
    const [index, setIndex] = useState(initialIndex)
    const problem = PROBLEMS[index % PROBLEMS.length]

    const next = () => {
        if (PROBLEMS.length <= 1) {
            setIndex(i => i + 1)
            return
        }
        let n = index
        while (n === index) n = Math.floor(Math.random() * PROBLEMS.length)
        setIndex(n)
    }

    return (
        <div className='mx-auto flex h-svh w-full max-w-7xl flex-col-reverse overflow-hidden lg:flex-row'>
            <section className='flex max-h-[55%] w-full shrink-0 flex-col overflow-y-auto lg:max-h-none lg:w-104 lg:shrink-0'>
                <div className='mx-auto w-full max-w-xl px-5 pt-6 pb-24 lg:pt-10 lg:pb-10'>
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Markdown>{problem.content}</Markdown>
                        </motion.div>
                    </AnimatePresence>
                    <div className='mt-8 flex justify-end'>
                        <Button variant='outline' className='rounded-lg w-full' onPress={next}>
                            下一题
                            <ArrowRightIcon className='size-4' />
                        </Button>
                    </div>
                </div>
            </section>
            <div className='flex min-h-0 flex-1 p-3 lg:p-6'>
                <Whiteboard key={index} className='h-full w-full' />
            </div>
        </div>
    )
}
