'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Typography } from '@tiptap/extension-typography'
import { Markdown } from 'tiptap-markdown'
import { EditorBubbleMenu } from './bubble-menu'
import { Chemdoodle } from './chemdoodle-node'
import { MathExtensions } from './math-node'
import { CeMark } from './ce-mark'

// The `Markdown` extension augments `editor.storage` with a `markdown` slot,
// but the runtime types don't carry it — declare a minimal view here so the
// serializer call type-checks without `any`.
type MarkdownStorage = { markdown: { getMarkdown(): string } }

export interface TiptapEditorProps {
    initialMarkdown: string
    onMarkdown: (markdown: string) => void
}

export function TiptapEditor({ initialMarkdown, onMarkdown }: TiptapEditorProps) {
    // `onMarkdown` is stable for the editor's lifetime (the parent wraps it in
    // useCallback keyed on `storageKey`, which only changes when the slug
    // changes — and that remounts this component via `key`). Capturing it once
    // in `onUpdate` is therefore correct and avoids a ref-write-during-render.
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Typography,
            Placeholder.configure({ placeholder: 'Begin writing…' }),
            Markdown.configure({
                html: true,
                tightLists: true,
                breaks: false,
                linkify: true,
            }),
            CeMark,
            ...MathExtensions,
            Chemdoodle,
        ],
        content: initialMarkdown,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-lg max-w-none min-h-[65vh] focus:outline-none',
            },
        },
        onUpdate({ editor }) {
            const storage = editor.storage as unknown as MarkdownStorage
            onMarkdown(storage.markdown.getMarkdown())
        },
    })

    return (
        <div className='relative flex min-h-0 flex-1 flex-col'>
            <EditorBubbleMenu editor={editor} />
            <EditorContent editor={editor} />
        </div>
    )
}

export type { Editor }
