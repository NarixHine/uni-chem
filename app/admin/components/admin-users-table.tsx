'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertDialog,
    Avatar,
    Button,
    Chip,
    Dropdown,
    EmptyState,
    Label,
    ListBox,
    Pagination,
    SearchField,
    Select,
    Spinner,
    Table,
    toast,
    type SortDescriptor,
} from '@heroui/react'
import { DotsThreeIcon, UserCircleIcon } from '@phosphor-icons/react'
import { useAction } from 'next-safe-action/hooks'
import { authClient } from '@/lib/auth-client'
import { banUser, unbanUser, setUserRole, removeUser } from '@/service/admin'

type AdminUser = {
    id: string
    email: string
    name: string
    image: string | null
    role: string
    banned: boolean
    banReason: string | null
    banExpires: Date | null
    emailVerified: boolean
    createdAt: Date
}

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE = 350
type SearchFieldOption = 'email' | 'name'

const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(d),
    )

const initials = (name: string) =>
    name
        .split(' ')
        .map(p => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'

export function AdminUsersTable() {
    const router = useRouter()
    const { data: session } = authClient.useSession()
    const currentUserId = session?.user.id

    const [users, setUsers] = useState<AdminUser[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [searchField, setSearchField] = useState<SearchFieldOption>('email')
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: 'createdAt',
        direction: 'descending',
    })
    const [isLoading, setIsLoading] = useState(true)
    const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const fetchIdRef = useRef(0)

    // Debounce the search input; reset to the first page on a new query.
    // Loading is flipped inside the timer callback (not synchronously in the
    // effect body) so it doesn't trip the set-state-in-effect rule.
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim())
            setPage(1)
            setIsLoading(true)
        }, SEARCH_DEBOUNCE)
        return () => clearTimeout(t)
    }, [search])

    // Fetch on mount and whenever the query params (or refreshKey) change.
    // All setState calls sit after the `await`, i.e. in an async continuation,
    // which the set-state-in-effect rule permits.
    useEffect(() => {
        const id = ++fetchIdRef.current
        let cancelled = false
        void (async () => {
            const { data, error } = await authClient.admin.listUsers({
                query: {
                    limit: PAGE_SIZE,
                    offset: (page - 1) * PAGE_SIZE,
                    searchValue: debouncedSearch || undefined,
                    searchField,
                    searchOperator: 'contains',
                    sortBy: String(sortDescriptor.column),
                    sortDirection: sortDescriptor.direction === 'descending' ? 'desc' : 'asc',
                },
            })
            // Ignore stale responses — a newer search/sort superseded this one.
            if (cancelled || id !== fetchIdRef.current) return
            setIsLoading(false)
            if (error || !data) {
                toast.danger(error?.message ?? 'Failed to load users')
                return
            }
            setUsers(data.users as AdminUser[])
            setTotal(data.total)
        })()
        return () => {
            cancelled = true
        }
    }, [page, debouncedSearch, searchField, sortDescriptor, refreshKey])

    const refresh = () => {
        setIsLoading(true)
        setRefreshKey(k => k + 1)
    }

    const { execute: execBan, isPending: banning } = useAction(banUser, {
        onSuccess: () => {
            toast.success('User banned')
            refresh()
        },
        onError: ({ error }) => toast.danger(error.serverError ?? 'Failed to ban user'),
    })
    const { execute: execUnban, isPending: unbanning } = useAction(unbanUser, {
        onSuccess: () => {
            toast.success('Ban lifted')
            refresh()
        },
        onError: ({ error }) => toast.danger(error.serverError ?? 'Failed to lift ban'),
    })
    const { execute: execSetRole, isPending: settingRole } = useAction(setUserRole, {
        onSuccess: ({ input }) => {
            toast.success(`Role set to ${input.role}`)
            refresh()
        },
        onError: ({ error }) => toast.danger(error.serverError ?? 'Failed to update role'),
    })
    const { execute: execRemove, isPending: removing } = useAction(removeUser, {
        onSuccess: ({ input }) => {
            toast.success('User removed')
            setRemoveTarget(t => (t?.id === input.userId ? null : t))
            refresh()
        },
        onError: ({ error }) => toast.danger(error.serverError ?? 'Failed to remove user'),
    })

    const busy = banning || unbanning || settingRole || removing

    const onImpersonate = async (user: AdminUser) => {
        const { error } = await authClient.admin.impersonateUser({ userId: user.id })
        if (error) {
            toast.danger(error.message ?? 'Failed to impersonate user')
            return
        }
        toast.info(`Viewing as ${user.name || user.email}`)
        router.push('/')
        router.refresh()
    }

    const onAction = (key: string | number, user: AdminUser) => {
        const isSelf = user.id === currentUserId
        switch (String(key)) {
            case 'ban':
                if (!isSelf) execBan({ userId: user.id })
                break
            case 'unban':
                execUnban({ userId: user.id })
                break
            case 'make-admin':
                execSetRole({ userId: user.id, role: 'admin' })
                break
            case 'make-user':
                execSetRole({ userId: user.id, role: 'user' })
                break
            case 'impersonate':
                void onImpersonate(user)
                break
            case 'remove':
                if (!isSelf) setRemoveTarget(user)
                break
        }
    }

    return (
        <div className='flex flex-col gap-4'>
            <Toolbar
                search={search}
                onSearch={setSearch}
                searchField={searchField}
                onSearchField={f => {
                    setSearchField(f)
                    setPage(1)
                    setIsLoading(true)
                }}
            />

            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label='Users'
                        className='min-w-180'
                        sortDescriptor={sortDescriptor}
                        onSortChange={d => {
                            setSortDescriptor(d)
                            setIsLoading(true)
                        }}
                    >
                        <Table.Header>
                            <Table.Column allowsSorting id='name' isRowHeader>
                                {({ sortDirection }) => (
                                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                                        Member
                                    </Table.SortableColumnHeader>
                                )}
                            </Table.Column>
                            <Table.Column allowsSorting id='role'>
                                {({ sortDirection }) => (
                                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                                        Role
                                    </Table.SortableColumnHeader>
                                )}
                            </Table.Column>
                            <Table.Column id='status'>Status</Table.Column>
                            <Table.Column allowsSorting id='createdAt'>
                                {({ sortDirection }) => (
                                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                                        Joined
                                    </Table.SortableColumnHeader>
                                )}
                            </Table.Column>
                            <Table.Column className='text-end'>Actions</Table.Column>
                        </Table.Header>
                        <Table.Body
                            items={users}
                            renderEmptyState={() =>
                                isLoading ? (
                                    <EmptyState className='flex w-full flex-col items-center justify-center gap-3 py-16'>
                                        <Spinner size='md' />
                                    </EmptyState>
                                ) : (
                                    <EmptyState className='flex w-full flex-col items-center justify-center gap-3 py-16 text-center'>
                                        <UserCircleIcon className='size-6 text-default-400' />
                                        <span className='text-sm text-default-500'>
                                            {debouncedSearch
                                                ? 'No users match your search.'
                                                : 'No users yet.'}
                                        </span>
                                    </EmptyState>
                                )
                            }
                        >
                            {user => (
                                <Table.Row key={user.id} id={user.id} textValue={user.name}>
                                    <Table.Cell>
                                        <div className='flex items-center gap-3'>
                                            <Avatar size='sm'>
                                                {user.image && <Avatar.Image src={user.image} />}
                                                <Avatar.Fallback>
                                                    {initials(user.name)}
                                                </Avatar.Fallback>
                                            </Avatar>
                                            <div className='flex flex-col'>
                                                <span className='text-sm font-medium'>
                                                    {user.name || 'Unnamed'}
                                                </span>
                                                <span className='text-xs text-default-500'>
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <RoleChip role={user.role} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <StatusChip user={user} />
                                    </Table.Cell>
                                    <Table.Cell className='text-default-500'>
                                        {formatDate(user.createdAt)}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className='flex justify-end'>
                                            <RowMenu
                                                user={user}
                                                isSelf={user.id === currentUserId}
                                                busy={busy}
                                                onAction={k => onAction(k, user)}
                                            />
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>

                <Table.Footer>
                    <Pagination size='sm'>
                        <Pagination.Summary>
                            {total === 0
                                ? '0 results'
                                : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
                        </Pagination.Summary>
                        <Pagination.Content>
                            <Pagination.Item>
                                <Pagination.Previous
                                    isDisabled={page === 1}
                                    onPress={() => {
                                        setPage(p => Math.max(1, p - 1))
                                        setIsLoading(true)
                                    }}
                                >
                                    <Pagination.PreviousIcon />
                                    Prev
                                </Pagination.Previous>
                            </Pagination.Item>
                            {pageRange(page, totalPages).map((p, i) =>
                                p === null ? (
                                    <Pagination.Item key={`gap-${i}`}>
                                        <span className='px-2 text-default-400'>…</span>
                                    </Pagination.Item>
                                ) : (
                                    <Pagination.Item key={p}>
                                        <Pagination.Link
                                            isActive={p === page}
                                            onPress={() => {
                                                setPage(p)
                                                setIsLoading(true)
                                            }}
                                        >
                                            {p}
                                        </Pagination.Link>
                                    </Pagination.Item>
                                ),
                            )}
                            <Pagination.Item>
                                <Pagination.Next
                                    isDisabled={page === totalPages}
                                    onPress={() => {
                                        setPage(p => Math.min(totalPages, p + 1))
                                        setIsLoading(true)
                                    }}
                                >
                                    Next
                                    <Pagination.NextIcon />
                                </Pagination.Next>
                            </Pagination.Item>
                        </Pagination.Content>
                    </Pagination>
                </Table.Footer>
            </Table>

            <RemoveConfirmDialog
                target={removeTarget}
                isPending={removing}
                onConfirm={() => {
                    if (removeTarget) execRemove({ userId: removeTarget.id })
                }}
                onCancel={() => setRemoveTarget(null)}
            />
        </div>
    )
}

// --- Toolbar ---------------------------------------------------------------

function Toolbar({
    search,
    onSearch,
    searchField,
    onSearchField,
}: {
    search: string
    onSearch: (v: string) => void
    searchField: SearchFieldOption
    onSearchField: (f: SearchFieldOption) => void
}) {
    return (
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <SearchField className='w-full sm:max-w-xs'>
                <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                        placeholder='Search users…'
                        aria-label='Search users'
                    />
                    {search && <SearchField.ClearButton onPress={() => onSearch('')} />}
                </SearchField.Group>
            </SearchField>

            <Select
                className='w-full sm:w-40'
                selectedKey={searchField}
                onSelectionChange={k => {
                    if (k === 'email' || k === 'name') onSearchField(k as SearchFieldOption)
                }}
                aria-label='Search field'
            >
                <Label className='sr-only'>Search by</Label>
                <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                    <ListBox>
                        <ListBox.Item id='email' textValue='Email'>
                            Email
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id='name' textValue='Name'>
                            Name
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    </ListBox>
                </Select.Popover>
            </Select>
        </div>
    )
}

// --- Row actions menu ------------------------------------------------------

function RowMenu({
    user,
    isSelf,
    busy,
    onAction,
}: {
    user: AdminUser
    isSelf: boolean
    busy: boolean
    onAction: (key: string | number) => void
}) {
    const isAdmin = user.role === 'admin'
    return (
        <Dropdown>
            <Button
                isIconOnly
                size='sm'
                variant='ghost'
                aria-label={`Actions for ${user.name || user.email}`}
                isDisabled={busy}
            >
                <DotsThreeIcon className='size-5 text-default-500' weight='bold' />
            </Button>
            <Dropdown.Popover placement='bottom end'>
                <Dropdown.Menu onAction={k => onAction(k)}>
                    <Dropdown.Item
                        id='impersonate'
                        textValue='Impersonate'
                        isDisabled={isSelf || isAdmin}
                    >
                        <Label>Impersonate</Label>
                    </Dropdown.Item>
                    {user.banned ? (
                        <Dropdown.Item id='unban' textValue='Lift ban'>
                            <Label>Lift ban</Label>
                        </Dropdown.Item>
                    ) : (
                        <Dropdown.Item
                            id='ban'
                            textValue='Ban'
                            isDisabled={isSelf}
                            variant='danger'
                        >
                            <Label>Ban</Label>
                        </Dropdown.Item>
                    )}
                    {isAdmin ? (
                        <Dropdown.Item
                            id='make-user'
                            textValue='Demote to user'
                            isDisabled={isSelf}
                        >
                            <Label>Demote to user</Label>
                        </Dropdown.Item>
                    ) : (
                        <Dropdown.Item id='make-admin' textValue='Promote to admin'>
                            <Label>Promote to admin</Label>
                        </Dropdown.Item>
                    )}
                    <Dropdown.Item
                        id='remove'
                        textValue='Remove'
                        isDisabled={isSelf}
                        variant='danger'
                    >
                        <Label>Remove</Label>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}

// --- Chips -----------------------------------------------------------------

function RoleChip({ role }: { role: string }) {
    const isAdmin = role === 'admin'
    return (
        <Chip size='sm' variant='soft' color={isAdmin ? 'accent' : 'default'}>
            {isAdmin ? 'Admin' : 'User'}
        </Chip>
    )
}

function StatusChip({ user }: { user: AdminUser }) {
    if (user.banned) {
        return (
            <Chip size='sm' variant='soft' color='danger'>
                Banned
            </Chip>
        )
    }
    return (
        <Chip size='sm' variant='soft' color='success'>
            Active
        </Chip>
    )
}

// --- Remove confirmation ---------------------------------------------------

function RemoveConfirmDialog({
    target,
    isPending,
    onConfirm,
    onCancel,
}: {
    target: AdminUser | null
    isPending: boolean
    onConfirm: () => void
    onCancel: () => void
}) {
    const isOpen = target !== null
    return (
        <AlertDialog
            isOpen={isOpen}
            onOpenChange={open => {
                if (!open) onCancel()
            }}
        >
            <AlertDialog.Backdrop>
                <AlertDialog.Container>
                    <AlertDialog.Dialog className='sm:max-w-105'>
                        <AlertDialog.CloseTrigger />
                        <AlertDialog.Header>
                            <AlertDialog.Icon status='danger' />
                            <AlertDialog.Heading>Remove user permanently?</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p className='text-sm leading-relaxed text-default-600'>
                                This permanently deletes{' '}
                                <strong className='text-foreground'>
                                    {target?.name || target?.email}
                                </strong>{' '}
                                and all associated data. This action cannot be undone.
                            </p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button slot='close' variant='tertiary' onPress={onCancel}>
                                Cancel
                            </Button>
                            <Button variant='danger' isPending={isPending} onPress={onConfirm}>
                                Remove user
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
        </AlertDialog>
    )
}

// --- Helpers ---------------------------------------------------------------

/** Compact page range with ellipses, e.g. 1 … 4 5 6 … 12. */
function pageRange(current: number, total: number): (number | null)[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const out: (number | null)[] = [1]
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    if (start > 2) out.push(null)
    for (let p = start; p <= end; p++) out.push(p)
    if (end < total - 1) out.push(null)
    out.push(total)
    return out
}
