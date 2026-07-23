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

// Chemistry palette — mirrors --chem-* tokens in globals.css.
const COLORS: Array<{ label: string; value: string; swatch: string }> = [
    { label: 'Blue', value: 'var(--chem-blue)', swatch: '#0077b6' },
    { label: 'Rust', value: 'var(--chem-rust)', swatch: '#c63a00' },
    { label: 'Green', value: 'var(--chem-green)', swatch: '#548c2f' },
    { label: 'Amber', value: 'var(--chem-amber)', swatch: '#fa7800' },
    { label: 'Crimson', value: 'var(--chem-crimson)', swatch: '#dd2d4a' },
    { label: 'Indigo', value: 'var(--chem-indigo)', swatch: '#4300fb' },
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
    if (!editor) return null

    const setLink = () => {
        const prev = editor.getAttributes('link').href
        const url = window.prompt('URL', prev ?? 'https://')
        if (url === null) return
        if (url === '') editor.chain().focus().unsetLink().run()
        else editor.chain().focus().setLink({ href: url }).run()
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
                    className={cn(
                        editor.isActive('ce') ? 'text-accent' : 'text-default-400',
                        'backdrop-blur bg-background/50',
                    )}
                >
                    <DropIcon className='size-4' weight='bold' />
                </Button>
                <Dropdown.Popover placement='bottom'>
                    <Dropdown.Menu
                        selectionMode='single'
                        selectedKeys={[editor.getAttributes('ce').style]}
                        onAction={key => {
                            editor.chain().focus().setCe(String(key)).run()
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
                        <Dropdown.Item
                            id='__unset__'
                            textValue='Remove color'
                            variant='danger'
                            onAction={() => editor.chain().focus().unsetCe().run()}
                        >
                            Remove color
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown>
        </BubbleMenu>
    )
}
