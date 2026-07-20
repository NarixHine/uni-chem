import { PROBLEMS } from '@/lib/problems'
import { SolveClient } from '@/components/solve/solve-client'

export const metadata = {
    title: '刷题 · 亲民反应',
}

// Pick a fresh problem per request rather than baking one into a static shell.
export const dynamic = 'force-dynamic'

export default function SolvePage() {
    // Server component: Math.random runs only on the server, so the chosen
    // index is passed as a prop and there is no hydration mismatch.
    // eslint-disable-next-line react-hooks/purity
    const initialIndex = Math.floor(Math.random() * PROBLEMS.length)
    return <SolveClient initialIndex={initialIndex} />
}
