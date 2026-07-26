'use client'

import dynamic from 'next/dynamic'
import type { VisualizerProps } from './visualizer'
import { VISUALIZER_SHELL_CLASS, DEFAULT_SCRIPT_SRC } from './visualizer'

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

/**
 * Preload the ChemDoodle script (≈700KB) the moment a Visualizer is rendered,
 * in parallel with the dynamic chunk below. Without this the download is
 * sequential: chunk → effect → script → execute, which is the main cause of
 * the ~2s delay before content appears. `<link rel=preload as=script>` caches
 * the response without executing; the later `<script>` tag is a cache hit.
 */
function ChemDoodlePreload() {
    return <link rel='preload' as='script' href={DEFAULT_SCRIPT_SRC} />
}

// Dynamic import with SSR disabled — CWC needs the browser.
const Visualizer = dynamic(() => import('./visualizer'), {
    ssr: false,
    loading: () => <VisualizerPlaceholder />,
})

export default function VisualizerExport(props: VisualizerProps) {
    return (
        <>
            <ChemDoodlePreload />
            <Visualizer {...props} />
        </>
    )
}
