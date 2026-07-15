'use client'

import {
    useEffect,
    useRef,
    useState,
    type ClipboardEvent,
    type FormEvent,
    type KeyboardEvent,
} from 'react'
import { Input, TextArea, Button } from '@heroui/react'
import { ArrowUpIcon, ImageIcon } from '@phosphor-icons/react/ssr'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { createConversation } from '@/service/conversations'
import { AttachmentTray, captureImagePaste, filesToParts, setPendingAttachments } from '@/components/chat/attachments'
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
    const lineInputRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)
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

    const expanded = input.includes('\n')

    const prevExpanded = useRef(expanded)
    useEffect(() => {
        if (prevExpanded.current === expanded) return
        prevExpanded.current = expanded
        const el = expanded ? textAreaRef.current : lineInputRef.current
        el?.focus()
        const len = el?.value.length ?? 0
        el?.setSelectionRange(len, len)
    }, [expanded])

    const submit = () => {
        const prompt = input.trim()
        if ((!prompt && attachments.length === 0) || isPending) return
        execute(prompt ? { prompt } : {})
    }

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        submit()
    }

    const onTextAreaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }

    const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            setInput(prev => `${prev}\n`)
            return
        }
        if (e.key === 'Enter') {
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

    const onTextAreaPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
        captureImagePaste(e, parts => setAttachments(prev => [...prev, ...parts]))
    }

    const onInputPaste = (e: ClipboardEvent<HTMLInputElement>) => {
        if (captureImagePaste(e, parts => setAttachments(prev => [...prev, ...parts]))) return
        const text = e.clipboardData.getData('text')
        if (text.includes('\n')) {
            e.preventDefault()
            setInput(prev => prev + text)
        }
    }

    const canSend = input.trim().length > 0 || attachments.length > 0

    const attachButton = (
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
    )

    const submitButton = (
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
    )

    return (
        <form onSubmit={onSubmit} className='mx-auto w-full max-w-xl'>
            <AttachmentTray parts={attachments} onRemove={removeAttachment} />
            {expanded ? (
                <div className='flex flex-col rounded-3xl border border-border bg-surface'>
                    <TextArea
                        ref={textAreaRef}
                        aria-label='开始对话'
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={onTextAreaKeyDown}
                        onPaste={onTextAreaPaste}
                        placeholder='问问反应、机理、概念、理论、题目…'
                        disabled={isPending}
                        rows={2}
                        className='flex-1 resize-none border-0 bg-transparent px-5 pt-3.5 text-base shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:opacity-60'
                    />
                    <div className='flex items-center justify-end gap-2 px-3 pb-3 pt-1'>
                        {attachButton}
                        {submitButton}
                    </div>
                </div>
            ) : (
                <div className='flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-5 pr-2'>
                    <Input
                        ref={lineInputRef}
                        aria-label='开始对话'
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={onInputKeyDown}
                        onPaste={onInputPaste}
                        placeholder='问问反应、机理、概念、理论、题目…'
                        disabled={isPending}
                        className='h-9 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 leading-9 text-base shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:opacity-60'
                    />
                    <div className='flex items-center gap-2'>
                        {attachButton}
                        {submitButton}
                    </div>
                </div>
            )}
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
