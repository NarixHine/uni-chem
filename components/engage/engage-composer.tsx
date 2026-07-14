'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { TextArea, Button } from '@heroui/react'
import { ArrowUpIcon } from '@phosphor-icons/react/ssr'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { createConversation } from '@/service/conversations'

/**
 * Composer for the Engage hub. Sending creates a conversation (title derived
 * from the prompt) and routes the user to it, passing the opening prompt so
 * the chat view fires it off automatically. The new conversation appears in
 * the rail once the layout re-fetches on navigation.
 */
export function EngageComposer() {
    const router = useRouter()
    const [input, setInput] = useState('')
    const { execute, isPending } = useAction(createConversation, {
        onSuccess: ({ data }) => {
            if (!data) return
            const prompt = input.trim()
            const target = prompt
                ? `/engage/${data.id}?prompt=${encodeURIComponent(prompt)}`
                : `/engage/${data.id}`
            setInput('')
            router.push(target, { transitionTypes: ['nav-forward'] })
        },
    })

    const submit = () => {
        const prompt = input.trim()
        if (!prompt || isPending) return
        execute({ prompt })
    }

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        submit()
    }

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }

    return (
        <form onSubmit={onSubmit} className='mx-auto w-full max-w-xl'>
            <div className='flex flex-col rounded-3xl border border-border bg-surface'>
                <TextArea
                    aria-label='开始对话'
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder='问问反应、机理或概念…'
                    disabled={isPending}
                    rows={3}
                    className='flex-1 resize-none border-0 bg-transparent px-5 pt-3.5 text-base shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:opacity-60'
                />
                <div className='flex items-center justify-between px-4 pb-3 pt-1'>
                    <p className='text-xs text-muted'>
                        <kbd className='rounded border border-border bg-default px-1.5 py-0.5 font-mono text-xs'>
                            ↵
                        </kbd>{' '}
                        发送
                    </p>
                    <Button
                        type='submit'
                        isIconOnly
                        isDisabled={!input.trim() || isPending}
                        size='lg'
                        variant='primary'
                        aria-label='开始对话'
                        className='size-9 rounded-full'
                    >
                        <ArrowUpIcon className='size-4' weight='bold' />
                    </Button>
                </div>
            </div>
        </form>
    )
}
