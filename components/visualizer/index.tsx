'use client'

import dynamic from 'next/dynamic'
import cn from 'cnfast'
import { VISUALIZER_SHELL_CLASS } from './visualizer'

// Blank placeholder that mirrors the canvas shell (responsive width +
// negative margins, 200px tall) so the client-only component mounts into a
// reserved footprint — preventing layout shift without a visible skeleton.
function VisualizerPlaceholder() {
    return <div aria-hidden className={cn(VISUALIZER_SHELL_CLASS, 'h-50')} />
}

// Dynamic import with SSR disabled — CWC needs the browser.
const Visualizer = dynamic(() => import('./visualizer'), {
    ssr: false,
    loading: () => <VisualizerPlaceholder />,
})

export default Visualizer
