import { AdminUsersTable } from './components/admin-users-table'

export default function AdminPage() {
    return (
        <div className='flex flex-col gap-8'>
            <header className='flex flex-col'>
                <h1 className='font-serif text-[clamp(2rem,5vw,2.75rem)] leading-none tracking-tight'>
                  Admin Dashboard
                </h1>
                <p className='text-[15px] leading-tight text-default-500 text-pretty'>
                    Manage accounts, roles, and access. Impersonate to preview a user&apos;s
                    experience.
                </p>
            </header>

            <AdminUsersTable />
        </div>
    )
}
