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
import { ArrowUpIcon, ImageIcon, StopIcon } from '@phosphor-icons/react/ssr'
import { useChat } from './chat-provider'
import { AttachmentTray, captureImagePaste, filesToParts } from './attachments'
import type { FileUIPart } from 'ai'

export function Composer() {
    const { sendMessage, stop, status } = useChat()
    const [input, setInput] = useState('')
    const [attachments, setAttachments] = useState<FileUIPart[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const lineInputRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const ready = status === 'ready'
    const streaming = status === 'streaming' || status === 'submitted'
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
        if (!ready) return
        const text = input.trim()
        if (!text && attachments.length === 0) return
        if (text && attachments.length > 0) sendMessage({ text, files: attachments })
        else if (text) sendMessage({ text })
        else sendMessage({ files: attachments })
        setInput('')
        setAttachments([])
        if (fileInputRef.current) fileInputRef.current.value = ''
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

    const attachButton = (
        <Button
            type='button'
            isIconOnly
            isDisabled={!ready}
            variant='ghost'
            aria-label='Attach images'
            size='lg'
            onPress={() => fileInputRef.current?.click()}
            className='size-9 rounded-full'
        >
            <ImageIcon className='size-5' />
        </Button>
    )

    const submitButton = streaming ? (
        <Button
            type='button'
            isIconOnly
            variant='secondary'
            aria-label='Stop streaming'
            onPress={() => stop()}
            size='lg'
            className='size-9 rounded-full'
        >
            <StopIcon className='size-4' weight='fill' />
        </Button>
    ) : (
        <Button
            type='submit'
            isIconOnly
            isDisabled={!ready || (input.trim().length === 0 && attachments.length === 0)}
            size='lg'
            variant='primary'
            aria-label='Send message'
            className='size-9 rounded-full'
        >
            <ArrowUpIcon className='size-4' weight='bold' />
        </Button>
    )

    return (
        <form onSubmit={onSubmit} className='pointer-events-auto mx-auto w-full max-w-2xl px-1'>
            <AttachmentTray parts={attachments} onRemove={removeAttachment} />
            {expanded ? (
                <div className='flex flex-col rounded-3xl border border-border bg-surface shadow-none'>
                    <TextArea
                        ref={textAreaRef}
                        aria-label='Message'
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={onTextAreaKeyDown}
                        onPaste={onTextAreaPaste}
                        placeholder='什么是 Claisen 缩合？'
                        disabled={!ready}
                        rows={2}
                        className='flex-1 resize-none border-0 bg-transparent px-5 pt-3.5 text-base shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:opacity-60'
                    />
                    <div className='flex items-center justify-end px-3 pb-3 pt-1 gap-2'>
                        {attachButton}
                        {submitButton}
                    </div>
                </div>
            ) : (
                <div className='flex items-center gap-2 rounded-full border border-border bg-surface shadow-none py-1.5 pl-5 pr-2'>
                    <Input
                        ref={lineInputRef}
                        aria-label='Message'
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={onInputKeyDown}
                        onPaste={onInputPaste}
                        placeholder='什么是 Claisen 缩合？'
                        disabled={!ready}
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
