'use client'

import type { FileUIPart, UIMessage } from 'ai'
import { XIcon } from '@phosphor-icons/react/ssr'

/** Convert a browser `FileList` (image-only) into `FileUIPart`s as data URLs. */
export async function filesToParts(fileList: FileList): Promise<FileUIPart[]> {
    return Promise.all(
        Array.from(fileList).map(
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

export interface AttachmentTrayProps {
    parts: FileUIPart[]
    onRemove: (index: number) => void
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
