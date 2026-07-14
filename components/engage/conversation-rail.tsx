'use client'

import { useState, type KeyboardEvent } from 'react'
import { Button, Input, Tooltip, Popover } from '@heroui/react'
import { PencilSimpleIcon, TrashIcon, TrashSimpleIcon } from '@phosphor-icons/react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { renameConversation, deleteConversation } from '@/service/conversations'

export interface ConversationRef {
    id: string
    title: string
}

interface ConversationRailProps {
    initial: ConversationRef[]
}

/**
 * Discrete conversation sidebar. Clicking an item opens it; rename and
 * delete actions appear on hover. Delete confirmation uses an inline
 * Popover rather than a modal dialog.
 */
export function ConversationRail({ initial }: ConversationRailProps) {
    const router = useRouter()
    const [conversations, setConversations] = useState(initial)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [draft, setDraft] = useState('')

    const { execute: execRename, isPending: renamingBusy } = useAction(renameConversation, {
        onSuccess: ({ data }) => {
            if (data) {
                setConversations(prev =>
                    prev.map(c => (c.id === data.id ? { ...c, title: data.title } : c)),
                )
            }
            setRenamingId(null)
        },
    })

    const { execute: execDelete, isPending: deletingBusy } = useAction(deleteConversation, {
        onSuccess: ({ input }) => {
            if (input?.id) {
                setConversations(prev => prev.filter(c => c.id !== input.id))
            }
        },
    })

    const openConversation = (id: string) =>
        router.push(`/engage/${id}`, { transitionTypes: ['nav-forward'] })

    const startRename = (id: string, title: string) => {
        setDraft(title)
        setRenamingId(id)
    }

    const commitRename = (id: string) => {
        const title = draft.trim()
        const current = conversations.find(c => c.id === id)
        if (!current || !title || title === current.title) {
            setRenamingId(null)
            return
        }
        execRename({ id, title })
    }

    const onRenameKey = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            commitRename(id)
        } else if (e.key === 'Escape') {
            setRenamingId(null)
        }
    }

    const onDeleted = (id: string) => {
        setConversations(prev => prev.filter(c => c.id !== id))
    }

    return (
        <div className='flex h-full flex-col'>
            <div className='mb-2 flex items-center justify-between px-1'>
                <h2 className='text-xs uppercase tracking-widest text-muted'>对话</h2>
                <span className='font-mono text-xs text-muted'>
                    {conversations.length.toString().padStart(2, '0')}
                </span>
            </div>

            <div className='scrollbar-none -mx-1 flex-1 overflow-y-auto'>
                {conversations.length === 0 ? (
                    <p className='px-1 py-8 text-center text-sm text-muted'>还没有对话。</p>
                ) : (
                    <ul className='flex flex-col gap-0.5 px-1'>
                        {conversations.map(c => (
                            <li key={c.id}>
                                {renamingId === c.id ? (
                                    <Input
                                        value={draft}
                                        onChange={e => setDraft(e.target.value)}
                                        onKeyDown={e => onRenameKey(e, c.id)}
                                        onBlur={() => commitRename(c.id)}
                                        disabled={renamingBusy}
                                        autoFocus
                                        maxLength={120}
                                        aria-label='重命名对话'
                                        className='w-full'
                                    />
                                ) : (
                                    <ConversationItem
                                        conversation={c}
                                        onOpen={openConversation}
                                        onRename={() => startRename(c.id, c.title)}
                                        renamingBusy={renamingBusy}
                                        deletingBusy={deletingBusy}
                                        onDelete={() => execDelete({ id: c.id })}
                                        onDeleted={onDeleted}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function ConversationItem({
    conversation,
    onOpen,
    onRename,
    renamingBusy,
    deletingBusy,
    onDelete,
    onDeleted,
}: {
    conversation: ConversationRef
    onOpen: (id: string) => void
    onRename: () => void
    renamingBusy: boolean
    deletingBusy: boolean
    onDelete: () => void
    onDeleted: (id: string) => void
}) {
    const [confirmOpen, setConfirmOpen] = useState(false)

    return (
        <div className='group/item flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-default'>
            <button
                type='button'
                onClick={() => onOpen(conversation.id)}
                className='flex-1 truncate text-left text-sm text-foreground/90'
                title={conversation.title}
            >
                {conversation.title}
            </button>
            <div className='flex shrink-0 items-center opacity-0 transition-opacity group-hover/item:opacity-100'>
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button
                            isIconOnly
                            variant='ghost'
                            size='sm'
                            onPress={onRename}
                            isDisabled={renamingBusy}
                            aria-label='重命名'
                            className='size-7 rounded-md'
                        >
                            <PencilSimpleIcon className='size-3.5' />
                        </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>重命名</Tooltip.Content>
                </Tooltip>
                <Popover isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
                    <Popover.Trigger>
                        <Button
                            isIconOnly
                            variant='ghost'
                            size='sm'
                            isDisabled={deletingBusy}
                            aria-label='删除'
                            className='size-7 rounded-md'
                        >
                            <TrashIcon className='size-3.5' />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content placement='right' className={'p-0 bg-transparent'}>
                        <Button
                            variant='danger'
                            size='sm'
                            className={'rounded-xl'}
                            isDisabled={deletingBusy}
                            onPress={() => {
                                onDelete()
                                setConfirmOpen(false)
                                onDeleted(conversation.id)
                            }}
                        >
                            <TrashSimpleIcon /> 确认删除
                        </Button>
                    </Popover.Content>
                </Popover>
            </div>
        </div>
    )
}
