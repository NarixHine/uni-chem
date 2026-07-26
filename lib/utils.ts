import { auth } from './auth';


export type Session = typeof auth.$Infer.Session;

export function verifyAdmin(session: Session | Session['user'] | null | undefined): boolean {
    if (!session) return false;
    const user = 'user' in session ? session.user : session;
    return user?.role === 'admin';
}
