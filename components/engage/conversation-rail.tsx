'use client'

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { Button, Input, Tooltip, Popover } from '@heroui/react'
import { PencilSimpleIcon, PlusIcon, TrashIcon, TrashSimpleIcon } from '@phosphor-icons/react'
import { useAction } from 'next-safe-action/hooks'
import { usePathname, useRouter } from 'next/navigation'
import cn from 'cnfast'
import { renameConversation, deleteConversation } from '@/service/conversations'

export interface ConversationRef {
    id: string
    title: string
}

interface ConversationRailProps {
    initial: ConversationRef[]
}

/**
 * Floating conversation sidebar. Rendered as a studio-lit panel with a
 * subtle background and soft inset highlights (à la PostAvatar) so it
 * reads as a discrete object floating over the canvas — present but
 * never noisy. The active conversation is derived from the pathname so
 * no server wiring is required. The same panel is embedded in the
 * mobile drawer (which only provides a transparent host layer).
 */
export function ConversationRail({ initial }: ConversationRailProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [conversations, setConversations] = useState(initial)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [draft, setDraft] = useState('')

    const activeId = useMemo(() => {
        const match = pathname?.match(/^\/engage\/([^/]+)/)
        return match?.[1] ?? null
    }, [pathname])

    // Reactively reflect AI-generated titles emitted by the chat after the
    // first assistant turn (see saveMessages action) without a full reload.
    useEffect(() => {
        const onRename = (e: Event) => {
            console.log('Renamed')
            const { id, title } = (e as CustomEvent).detail ?? {}
            console.log({ id, title })
            if (!id || !title) return
            setConversations(prev =>
                prev.some(c => c.id === id)
                    ? prev.map(c => (c.id === id ? { ...c, title } : c))
                    : [{ id, title }, ...prev],
            )
        }
        window.addEventListener('conversation:renamed', onRename)
        return () => window.removeEventListener('conversation:renamed', onRename)
    }, [])

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
                if (input.id === activeId) {
                    router.push('/engage', { transitionTypes: ['nav-forward'] })
                }
            }
        },
    })

    const openConversation = (id: string) =>
        router.push(`/engage/${id}`, { transitionTypes: ['nav-forward'] })

    const newConversation = () => router.push('/engage', { transitionTypes: ['nav-forward'] })

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
        <aside
            aria-label='对话列表'
            className='relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface/70 backdrop-blur-xl'
            style={{
                viewTransitionName: 'conversation-rail',
                boxShadow:
                    'inset 0 0.5px 0.5px rgba(255,255,255,0.45), inset 0 -0.5px 0.5px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -10px rgba(0,0,0,0.10)',
            }}
        >
            {/* Studio lighting overlay — soft top-light sheen + grounded bottom shade */}
            <span
                aria-hidden
                className='pointer-events-none absolute inset-0 rounded-2xl'
                style={{
                    background:
                        'linear-gradient(150deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.05) 100%)',
                }}
            />

            {/* Header */}
            <div className='relative flex items-center justify-between px-5 pt-4 pb-2'>
                <div className='flex items-baseline gap-2'>
                    <h2 className='text-sm font-medium uppercase text-muted'>对话</h2>
                    <span className='font-mono text-sm tabular-nums text-muted/70'>
                        {conversations.length.toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* List */}
            <div className='scrollbar-none relative flex-1 overflow-y-auto px-2 pb-2'>
                {conversations.length === 0 ? (
                    <div className='flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center'>
                        <p className='text-sm text-muted'>还没有对话。</p>
                    </div>
                ) : (
                    <ul className='flex flex-col gap-px'>
                        {conversations.map(c => (
                            <li key={c.id}>
                                {renamingId === c.id ? (
                                    <div className='px-1 py-1'>
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
                                    </div>
                                ) : (
                                    <ConversationItem
                                        conversation={c}
                                        active={c.id === activeId}
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

            {/* Footer — quiet new-conversation affordance balances the header */}
            <div className='relative border-t border-border/40 p-2'>
                <Button
                    variant='ghost'
                    onPress={newConversation}
                    className='w-full justify-start rounded-lg px-2'
                >
                    <PlusIcon className='size-4' weight='regular' />
                    新建对话
                </Button>
            </div>
        </aside>
    )
}

function ConversationItem({
    conversation,
    active,
    onOpen,
    onRename,
    renamingBusy,
    deletingBusy,
    onDelete,
    onDeleted,
}: {
    conversation: ConversationRef
    active: boolean
    onOpen: (id: string) => void
    onRename: () => void
    renamingBusy: boolean
    deletingBusy: boolean
    onDelete: () => void
    onDeleted: (id: string) => void
}) {
    const [confirmOpen, setConfirmOpen] = useState(false)

    return (
        <div
            className={cn(
                'group/item relative flex items-center gap-1 rounded-lg py-1.5 pl-4 pr-1.5 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                active ? 'bg-default/80' : 'hover:bg-default/50',
            )}
        >
            <button
                type='button'
                onClick={() => onOpen(conversation.id)}
                className={cn(
                    'flex-1 truncate text-left text-sm transition-colors',
                    active ? 'text-foreground' : 'text-foreground/80',
                )}
                title={conversation.title}
            >
                {conversation.title}
            </button>
            <div
                data-active={active}
                className='flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover/item:opacity-100 group-focus-within/item:opacity-100 data-[active=true]:opacity-100'
            >
                <Tooltip delay={200} closeDelay={100}>
                    <Button
                        isIconOnly
                        variant='ghost'
                        size='sm'
                        onPress={onRename}
                        isDisabled={renamingBusy}
                        aria-label='重命名'
                        className='size-6 rounded-md text-muted hover:text-foreground'
                    >
                        <PencilSimpleIcon className='size-3.5' weight='regular' />
                    </Button>
                    <Tooltip.Content>重命名</Tooltip.Content>
                </Tooltip>
                <Popover isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
                    <Button
                        isIconOnly
                        variant='ghost'
                        size='sm'
                        isDisabled={deletingBusy}
                        aria-label='删除'
                        className='size-6 rounded-md text-muted hover:text-danger'
                    >
                        <TrashIcon className='size-3.5' weight='regular' />
                    </Button>
                    <Popover.Content placement='right' offset={20}>
                        <Popover.Dialog className='p-0 bg-transparent'>
                            <Button
                                variant='danger'
                                size='sm'
                                isDisabled={deletingBusy}
                                onPress={() => {
                                    onDelete()
                                    setConfirmOpen(false)
                                    onDeleted(conversation.id)
                                }}
                                className='rounded-xl'
                            >
                                <TrashSimpleIcon className='size-3.5' weight='fill' />
                                确认删除
                            </Button>
                        </Popover.Dialog>
                    </Popover.Content>
                </Popover>
            </div>
        </div>
    )
}
