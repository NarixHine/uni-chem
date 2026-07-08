'use client'

import dynamic from "next/dynamic"

// Dynamic import with SSR disabled — CWC needs the browser
const Visualizer = dynamic(
  () => import("./visualizer"),
  { ssr: false }
)

export default Visualizer
