'use client'

import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor } from '@tiptap/core'
import {
    TextBolderIcon,
    TextItalicIcon,
    TextStrikethroughIcon,
    CodeIcon,
    ArrowSquareOutIcon,
} from '@phosphor-icons/react'

export function EditorBubbleMenu({ editor }: { editor: Editor | null }) {
    if (!editor) return null

    const setLink = () => {
        const prev = editor.getAttributes('link').href
        const url = window.prompt('URL', prev ?? 'https://')
        if (url === null) return
        if (url === '') editor.chain().focus().unsetLink().run()
        else editor.chain().focus().setLink({ href: url }).run()
    }

    const item = (
        active: boolean,
        Icon: React.ComponentType<{ className?: string; weight?: 'bold' }>,
        onClick: () => void,
        label: string,
    ) => (
        <button
            type='button'
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            className={
                'flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors ' +
                (active ? 'text-foreground' : 'text-default-400 hover:text-foreground')
            }
        >
            <Icon className='size-4' weight='bold' />
        </button>
    )

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor: ed, state, from, to }) =>
                from !== to && !ed.isActive('chemdoodle') && !state.selection.empty
            }
            options={{ offset: 8, placement: 'top' }}
            className='flex items-center gap-0.5 rounded-lg border border-border bg-surface px-1 py-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        >
            {item(editor.isActive('bold'), TextBolderIcon, () => editor.chain().focus().toggleBold().run(), 'Bold')}
            <div className='mx-0.5 h-4 w-px bg-border' />
            {item(editor.isActive('italic'), TextItalicIcon, () => editor.chain().focus().toggleItalic().run(), 'Italic')}
            <div className='mx-0.5 h-4 w-px bg-border' />
            {item(editor.isActive('strike'), TextStrikethroughIcon, () => editor.chain().focus().toggleStrike().run(), 'Strikethrough')}
            <div className='mx-0.5 h-4 w-px bg-border' />
            {item(editor.isActive('code'), CodeIcon, () => editor.chain().focus().toggleCode().run(), 'Inline code')}
            <div className='mx-0.5 h-4 w-px bg-border' />
            {item(editor.isActive('link'), ArrowSquareOutIcon, setLink, 'Link')}
        </BubbleMenu>
    )
}
