'use client'

import dynamic from 'next/dynamic'
import { VISUALIZER_SHELL_CLASS } from './visualizer'

// Mirrors the real component's shell + canvas structure (same classes,
// same default 200×200 intrinsic size) so parent `[&_canvas]` height
// overrides, e.g. quiz options force `h-32`, apply identically to the placeholder.
function VisualizerPlaceholder() {
    return (
        <div aria-hidden className={VISUALIZER_SHELL_CLASS}>
            <canvas width={200} height={200} className='block h-full w-full' />
        </div>
    )
}

// Dynamic import with SSR disabled — CWC needs the browser.
const Visualizer = dynamic(() => import('./visualizer'), {
    ssr: false,
    loading: () => <VisualizerPlaceholder />,
})

export default Visualizer
