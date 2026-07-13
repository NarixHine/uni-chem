'use client'

import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { TextArea, Button } from '@heroui/react'
import { ArrowUpIcon, ImageIcon, StopIcon } from '@phosphor-icons/react/ssr'
import { useChat } from './chat-provider'
import { AttachmentTray, filesToParts } from './attachments'
import type { FileUIPart } from 'ai'

export function Composer() {
    const { sendMessage, stop, status } = useChat()
    const [input, setInput] = useState('')
    const [attachments, setAttachments] = useState<FileUIPart[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const ready = status === 'ready'
    const streaming = status === 'streaming' || status === 'submitted'

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

    return (
        <form onSubmit={onSubmit} className='pointer-events-auto mx-auto w-full max-w-2xl px-1'>
            <AttachmentTray parts={attachments} onRemove={removeAttachment} />
            <div className='flex flex-col rounded-3xl border border-border bg-surface shadow-none'>
                <TextArea
                    aria-label='Message'
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    placeholder="What's the resonance theory?"
                    disabled={!ready}
                    rows={3}
                    className='flex-1 resize-none border-0 bg-transparent px-5 pt-3.5 text-base shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:opacity-60'
                />
                <div className='flex items-center justify-end px-3 pb-3 pt-1 gap-2'>
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
                    {streaming ? (
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
                            isDisabled={
                                !ready || (input.trim().length === 0 && attachments.length === 0)
                            }
                            size='lg'
                            variant='primary'
                            aria-label='Send message'
                            className='size-9 rounded-full'
                        >
                            <ArrowUpIcon className='size-4' weight='bold' />
                        </Button>
                    )}
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
