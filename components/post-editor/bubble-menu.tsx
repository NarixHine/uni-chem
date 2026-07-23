'use client'

import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor } from '@tiptap/core'
import { Button, ButtonGroup, Dropdown } from '@heroui/react'
import {
    TextBolderIcon,
    TextItalicIcon,
    TextStrikethroughIcon,
    CodeIcon,
    ArrowSquareOutIcon,
    FunctionIcon,
    DropIcon,
} from '@phosphor-icons/react'
import cn from 'cnfast'
import { useRef } from 'react'

// Chemistry palette — mirrors --chem-* tokens in globals.css. The `value`
// is the full inline-style declaration (`color:var(--chem-*)`) so it matches
// the flavored source's `<ce style="…">` format byte-for-byte.
const COLORS: Array<{ label: string; value: string; swatch: string }> = [
    { label: 'Blue', value: 'color:var(--chem-blue)', swatch: '#0077b6' },
    { label: 'Rust', value: 'color:var(--chem-rust)', swatch: '#c63a00' },
    { label: 'Green', value: 'color:var(--chem-green)', swatch: '#548c2f' },
    { label: 'Amber', value: 'color:var(--chem-amber)', swatch: '#fa7800' },
    { label: 'Crimson', value: 'color:var(--chem-crimson)', swatch: '#dd2d4a' },
    { label: 'Indigo', value: 'color:var(--chem-indigo)', swatch: '#4300fb' },
]

function IconBtn({
    active,
    Icon,
    onClick,
    label,
}: {
    active: boolean
    Icon: React.ComponentType<{ className?: string; weight?: 'bold' }>
    onClick: () => void
    label: string
}) {
    return (
        <Button
            isIconOnly
            size='sm'
            variant='outline'
            onPress={onClick}
            aria-label={label}
            aria-pressed={active}
            className={active ? 'text-accent' : 'text-default-400'}
        >
            <Icon className='size-4' weight='bold' />
        </Button>
    )
}

export function EditorBubbleMenu({ editor }: { editor: Editor | null }) {
    // Snapshot the editor's text selection before the Dropdown popover captures
    // focus. Must be declared before the early `return null` so hook order is
    // stable across renders.
    const selRef = useRef<{ from: number; to: number } | null>(null)

    if (!editor) return null

    const setLink = () => {
        const prev = editor.getAttributes('link').href
        const url = window.prompt('URL', prev ?? 'https://')
        if (url === null) return
        if (url === '') editor.chain().focus().unsetLink().run()
        else editor.chain().focus().setLink({ href: url }).run()
    }

    // The Dropdown popover captures focus while open, which collapses the
    // editor's text selection by the time `onAction` fires — so `setMark`
    // would only set a pending mark (no visible color). Snapshot the range on
    // trigger press and restore it before applying the color.
    const snapshotSel = () => {
        const { from, to, empty } = editor.state.selection
        if (!empty) selRef.current = { from, to }
    }
    const applyCe = (value: string) => {
        const sel = selRef.current
        const chain = editor.chain().focus()
        if (sel) chain.setTextSelection(sel)
        chain.setCe(value).run()
    }
    const clearCe = () => {
        const sel = selRef.current
        const chain = editor.chain().focus()
        if (sel) chain.setTextSelection(sel)
        chain.unsetCe().run()
    }

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor: ed, state, from, to }) =>
                from !== to && !ed.isActive('chemdoodle') && !state.selection.empty
            }
            options={{ offset: 8, placement: 'top' }}
            className='flex items-center gap-0.5'
        >
            <ButtonGroup size='sm' variant='primary' className={'backdrop-blur rounded-full bg-background/50'}>
                <IconBtn
                    active={editor.isActive('bold')}
                    Icon={TextBolderIcon}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    label='Bold'
                />
                <IconBtn
                    active={editor.isActive('italic')}
                    Icon={TextItalicIcon}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    label='Italic'
                />
                <IconBtn
                    active={editor.isActive('strike')}
                    Icon={TextStrikethroughIcon}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    label='Strikethrough'
                />
                <IconBtn
                    active={editor.isActive('code')}
                    Icon={CodeIcon}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    label='Inline code'
                />
                <IconBtn
                    active={editor.isActive('link')}
                    Icon={ArrowSquareOutIcon}
                    onClick={setLink}
                    label='Link'
                />
            </ButtonGroup>

            <div className='mx-0.5 h-5 w-px bg-border' />

            <ButtonGroup size='sm' variant='outline' className={'backdrop-blur rounded-full bg-background/50'}>
                <IconBtn
                    active={editor.isActive('inlinemath')}
                    Icon={FunctionIcon}
                    onClick={() => {
                        if (editor.isActive('inlinemath')) return
                        editor.chain().focus().insertInlineMath('').run()
                    }}
                    label='Inline math'
                />
                <IconBtn
                    active={editor.isActive('blockmath')}
                    Icon={FunctionIcon}
                    onClick={() => {
                        if (editor.isActive('blockmath')) return
                        editor.chain().focus().insertBlockMath('').run()
                    }}
                    label='Block math'
                />
            </ButtonGroup>

            <div className='mx-0.5 h-5 w-px bg-border' />

            <Dropdown>
                <Button
                    isIconOnly
                    size='sm'
                    variant='outline'
                    aria-label='Color'
                    onPress={snapshotSel}
                    className={cn(
                        editor.isActive('ce') ? 'text-accent' : 'text-default-400',
                        'backdrop-blur bg-background/50',
                    )}
                >
                    <DropIcon className='size-4' weight='bold' />
                </Button>
                <Dropdown.Popover placement='bottom'>
                    <Dropdown.Menu
                        onAction={key => {
                            if (key === '__unset__') clearCe()
                            else applyCe(String(key))
                        }}
                    >
                        {COLORS.map(c => (
                            <Dropdown.Item key={c.value} id={c.value} textValue={c.label}>
                                <span className='flex items-center gap-2'>
                                    <span
                                        className='inline-block size-3 rounded-full'
                                        style={{ background: c.swatch }}
                                    />
                                    {c.label}
                                </span>
                            </Dropdown.Item>
                        ))}
                        <Dropdown.Item id='__unset__' textValue='Remove color' variant='danger'>
                            Remove color
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown>
        </BubbleMenu>
    )
}
