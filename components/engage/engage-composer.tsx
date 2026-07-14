'use client'

import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { TextArea, Button } from '@heroui/react'
import { ArrowUpIcon, ImageIcon } from '@phosphor-icons/react/ssr'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { createConversation } from '@/service/conversations'
import {
    AttachmentTray,
    filesToParts,
    setPendingAttachments,
} from '@/components/chat/attachments'
import type { FileUIPart } from 'ai'

/**
 * Composer for the Engage hub. Sending creates a conversation (title derived
 * from the prompt) and routes the user to it, passing the opening prompt so
 * the chat view fires it off automatically. The new conversation appears in
 * the rail once the layout re-fetches on navigation.
 *
 * Image attachments picked or pasted here are handed off to the new
 * conversation via an in-memory map so the opening turn includes them.
 */
export function EngageComposer() {
    const router = useRouter()
    const [input, setInput] = useState('')
    const [attachments, setAttachments] = useState<FileUIPart[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { execute, isPending } = useAction(createConversation, {
        onSuccess: ({ data }) => {
            if (!data) return
            if (attachments.length > 0) setPendingAttachments(data.id, attachments)
            const prompt = input.trim()
            const target = prompt
                ? `/engage/${data.id}?prompt=${encodeURIComponent(prompt)}`
                : `/engage/${data.id}`
            setInput('')
            setAttachments([])
            if (fileInputRef.current) fileInputRef.current.value = ''
            router.push(target, { transitionTypes: ['nav-forward'] })
        },
    })

    const submit = () => {
        const prompt = input.trim()
        if ((!prompt && attachments.length === 0) || isPending) return
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

    const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const parts = await filesToParts(e.target.files)
        setAttachments(prev => [...prev, ...parts])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeAttachment = (index: number) =>
        setAttachments(prev => prev.filter((_, i) => i !== index))

    const onPaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const files = Array.from(e.clipboardData.items)
            .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
            .map(item => item.getAsFile())
            .filter((f): f is File => f !== null)
        if (files.length === 0) return
        e.preventDefault()
        const parts = await filesToParts(files)
        setAttachments(prev => [...prev, ...parts])
    }

    const canSend = input.trim().length > 0 || attachments.length > 0

    return (
        <form onSubmit={onSubmit} className='mx-auto w-full max-w-xl'>
            <AttachmentTray parts={attachments} onRemove={removeAttachment} />
            <div className='flex flex-col rounded-3xl border border-border bg-surface'>
                <TextArea
                    aria-label='开始对话'
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    placeholder='问问反应、机理、概念、理论、题目…'
                    disabled={isPending}
                    rows={3}
                    className='flex-1 resize-none border-0 bg-transparent px-5 pt-3.5 text-base shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:opacity-60'
                />
                <div className='flex items-center justify-end gap-2 px-3 pb-3 pt-1'>
                    <Button
                        type='button'
                        isIconOnly
                        isDisabled={isPending}
                        variant='ghost'
                        aria-label='添加图片'
                        size='lg'
                        onPress={() => fileInputRef.current?.click()}
                        className='size-9 rounded-full'
                    >
                        <ImageIcon className='size-5' />
                    </Button>
                    <Button
                        type='submit'
                        isIconOnly
                        isDisabled={!canSend || isPending}
                        size='lg'
                        variant='primary'
                        aria-label='开始对话'
                        className='size-9 rounded-full'
                    >
                        <ArrowUpIcon className='size-4' weight='bold' />
                    </Button>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                multiple
                onChange={onPickFiles}
                className='hidden'
            />
        </form>
    )
}
