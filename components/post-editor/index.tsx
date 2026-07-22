'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Button, toast } from '@heroui/react'
import {
    ArrowCounterClockwiseIcon,
    ArrowLeftIcon,
    CopyIcon,
    ChecksIcon,
} from '@phosphor-icons/react'
import { TiptapEditor } from './tiptap-editor'

const STORAGE_PREFIX = 'uni-chem:editor:'

export interface PostEditorProps {
    slug: string
    title: string
    initialContent: string
}

export function PostEditor({ slug, title, initialContent }: PostEditorProps) {
    const storageKey = STORAGE_PREFIX + slug

    // Lazy initializer reads localStorage exactly once — no hydrate effect,
    // no set-state-in-effect. This component is mounted with `ssr: false`
    // (see app/admin/editor/[slug]/editor-client.tsx), so `window` is always
    // defined here.
    const [stored, setStored] = useState<string>(() =>
        typeof window === 'undefined'
            ? initialContent
            : window.localStorage.getItem(storageKey) ?? initialContent,
    )
    // Bumped on Reset to remount the editor with fresh source.
    const [resetKey, setResetKey] = useState(0)
    // Flashes true briefly after Copy to confirm success in the button itself.
    const [copied, setCopied] = useState(false)

    const dirty = stored !== initialContent

    // Persist on every change. The editor's markdown output IS the flavored
    // source — `:::` blocks round-trip through the Chemdoodle node verbatim —
    // so the copy button emits flavored markdown with no transform layer.
    // Writing to localStorage is a side effect of the user's input event, not a
    // render-derived effect, so it stays out of useEffect and lives here.
    // Stable identity keeps the editor from being torn down on each keystroke.
    const onMarkdown = useCallback(
        (md: string) => {
            setStored(md)
            window.localStorage.setItem(storageKey, md)
        },
        [storageKey],
    )

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(stored)
            toast.success('Flavored Markdown copied')
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1400)
        } catch {
            toast.danger('Clipboard unavailable')
        }
    }

    const onReset = () => {
        window.localStorage.removeItem(storageKey)
        setStored(initialContent)
        setResetKey(k => k + 1)
        toast.info('Reverted to source')
    }

    return (
        <div className='flex flex-col gap-8'>
            <header className='flex flex-col gap-6'>
                <div className='flex items-center justify-between gap-2'>
                    <Button
                        render={props => <Link href={`/learn/${slug}`} {...(props as object)} />}
                        variant='ghost'
                        size='sm'
                    >
                        <ArrowLeftIcon className='size-4' weight='bold' />
                        Back to article
                    </Button>
                    <div className='flex items-center gap-1.5'>
                        <Button variant='ghost' size='sm' onPress={onReset} isDisabled={!dirty}>
                            <ArrowCounterClockwiseIcon className='size-4' weight='bold' />
                            Reset
                        </Button>
                        <Button variant='primary' size='sm' onPress={onCopy}>
                            {copied ? (
                                <ChecksIcon className='size-4' weight='bold' />
                            ) : (
                                <CopyIcon className='size-4' weight='bold' />
                            )}
                            {copied ? 'Copied' : 'Copy Markdown'}
                        </Button>
                    </div>
                </div>
                <div className='flex flex-col gap-1'>
                    <h1 className='font-serif text-3xl leading-tight tracking-tight'>
                        {title}
                    </h1>
                    <div className='flex items-center gap-2 font-mono text-xs text-default-400'>
                        <span>{slug}.md</span>
                        <span className='text-default-300'>·</span>
                        {dirty ? (
                            <span className='text-amber-700'>unsaved local draft</span>
                        ) : (
                            <span>matches source</span>
                        )}
                    </div>
                </div>
            </header>

            <section className='flex min-w-0 flex-col gap-2'>
                <div className='flex min-h-[70vh] flex-col overflow-hidden'>
                    <TiptapEditor
                        key={resetKey}
                        initialMarkdown={stored}
                        onMarkdown={onMarkdown}
                    />
                </div>
            </section>
        </div>
    )
}
