'use client'

import type { ClipboardEvent } from 'react'
import { toast } from '@heroui/react'
import type { FileUIPart, UIMessage } from 'ai'
import { XIcon } from '@phosphor-icons/react/ssr'

/** Convert browser files (image-only) into `FileUIPart`s as data URLs. */
export async function filesToParts(files: FileList | File[]): Promise<FileUIPart[]> {
    return Promise.all(
        Array.from(files).map(
            file =>
                new Promise<FileUIPart>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () =>
                        resolve({
                            type: 'file',
                            mediaType: file.type || 'image',
                            filename: file.name,
                            url: reader.result as string,
                        })
                    reader.onerror = () => reject(reader.error)
                    reader.readAsDataURL(file)
                }),
        ),
    )
}

/** Extract the image `file` parts from a message (for rendering). */
export function imageFileParts(message: UIMessage): FileUIPart[] {
    return message.parts.filter(
        (p): p is FileUIPart => p.type === 'file' && p.mediaType.startsWith('image/'),
    )
}

/**
 * Handle image paste from a clipboard event. Image files are converted to
 * attachment parts and handed to `onAdd`; any pasted file that isn't an
 * image triggers a warning toast. Returns `true` when the event was
 * consumed (images captured or unsupported files blocked), `false` when
 * there were no files at all — so the caller can fall back to text handling.
 */
export function captureImagePaste<T extends HTMLElement>(
    e: ClipboardEvent<T>,
    onAdd: (parts: FileUIPart[]) => void,
): boolean {
    const fileItems = Array.from(e.clipboardData.items).filter(item => item.kind === 'file')
    if (fileItems.length === 0) return false

    const imageFiles = fileItems
        .map(item => item.getAsFile())
        .filter((f): f is File => f !== null && f.type.startsWith('image/'))

    if (imageFiles.length < fileItems.length) toast.warning('仅支持粘贴图片')
    if (imageFiles.length === 0) {
        e.preventDefault()
        return true
    }
    e.preventDefault()
    void filesToParts(imageFiles).then(onAdd)
    return true
}

export interface AttachmentTrayProps {
    parts: FileUIPart[]
    onRemove: (index: number) => void
}

/**
 * In-memory handoff for opening attachments seeded from the Engage hub.
 * Lives only for the current tab session (cleared on reload), which is fine
 * since the opening turn fires once on mount. Avoids serializing large image
 * data URLs through search params or sessionStorage.
 */
const pendingAttachments = new Map<string, FileUIPart[]>()

export function setPendingAttachments(id: string, parts: FileUIPart[]) {
    pendingAttachments.set(id, parts)
}

export function takePendingAttachments(id: string): FileUIPart[] | undefined {
    const parts = pendingAttachments.get(id)
    if (parts) pendingAttachments.delete(id)
    return parts
}

/** Thumbnail strip of pending attachments, shown above the composer. */
export function AttachmentTray({ parts, onRemove }: AttachmentTrayProps) {
    if (parts.length === 0) return null
    return (
        <div className='mb-2 flex flex-wrap gap-2'>
            {parts.map((part, i) => (
                <div
                    key={i}
                    className='group relative size-16 overflow-hidden rounded-2xl border border-border bg-surface'
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={part.url}
                        alt={part.filename ?? 'attachment'}
                        className='size-full object-cover'
                    />
                    <button
                        type='button'
                        onClick={() => onRemove(i)}
                        aria-label='Remove attachment'
                        className='absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-foreground/70 text-background transition-opacity group-hover:opacity-100'
                    >
                        <XIcon className='size-3' weight='bold' />
                    </button>
                </div>
            ))}
        </div>
    )
}

export interface MessageImagesProps {
    parts: FileUIPart[]
}

/** Render image `file` parts inline within a message. */
export function MessageImages({ parts }: MessageImagesProps) {
    if (parts.length === 0) return null
    return (
        <div className='flex flex-wrap gap-2'>
            {parts.map((part, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    key={i}
                    src={part.url}
                    alt={part.filename ?? 'image'}
                    className='max-h-60 rounded-field border border-border object-contain'
                />
            ))}
        </div>
    )
}
