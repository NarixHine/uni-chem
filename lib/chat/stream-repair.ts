/**
 * Streaming-safe repair for flavored Markdown whose assistant output may
 * contain partially-streamed JSON.
 *
 * The flavored-Markdown `Visualizer` fence (`:::json\n{ … }\n:::`) is only
 * recognized once its closing `:::` arrives. Before that, the raw
 * `:::json\n{ …` tail renders as literal text and — worse — the in-progress
 * molecule never previews. To render the Visualizer *as it streams*, we:
 *
 *   1. detect a trailing unclosed `:::` fence (an opener with no closer),
 *   2. complete its inner JSON structurally (close strings, braces,
 *      brackets; trim dangling commas / colons),
 *   3. synthesize the missing closing `:::` so `preprocessVisualizer`
 *      matches and emits a live `<Visualizer mol={…}/>` for the partial
 *      molecule.
 *
 * The repair is best-effort: if the partial JSON cannot be made valid, the
 * unclosed fence is dropped from the preview entirely (no crash, no raw
 * `:::` text leaks through) and will reappear once the stream completes.
 *
 * Math (`$…$`, `$$…$$`) and Quiz (`||| … |||`) fences are left untouched:
 * their preprocessors only match *closed* constructs, so an unclosed one
 * is harmlessly held back as literal text until the closing delimiter
 * arrives.
 */

/** Pair of `:::` fence lines, opener or closer (matches `^:::` on a line). */
const FENCE_LINE = /^:::.*$/gm

/**
 * Structurally complete a partial JSON string so `JSON.parse` succeeds.
 * Returns the completed string, or `null` if it cannot be made valid.
 */
/** Complete one candidate: append closers + clean dangling punctuation. */
function complete(input: string): string {
    let inString = false
    let escape = false
    const stack: Array<'{' | '[' | '('> = []

    for (let i = 0; i < input.length; i++) {
        const ch = input[i]

        if (inString) {
            if (escape) escape = false
            else if (ch === '\\') escape = true
            else if (ch === '"') inString = false
            continue
        }

        if (ch === '"') inString = true
        else if (ch === '{' || ch === '[' || ch === '(') stack.push(ch)
        else if (ch === '}' || ch === ']' || ch === ')') {
            const opener = ch === '}' ? '{' : ch === ']' ? '[' : '('
            for (let j = stack.length - 1; j >= 0; j--) {
                if (stack[j] === opener) stack.length = j
                break
            }
        }
    }

    // A trailing `\` would escape the closing quote we add — drop it.
    let out = input
    if (escape && out.endsWith('\\')) out = out.slice(0, -1)
    if (inString) out += '"'

    // Close any still-open containers, innermost first.
    let suffix = ''
    for (let j = stack.length - 1; j >= 0; j--) {
        const opener = stack[j]
        suffix += opener === '{' ? '}' : opener === '[' ? ']' : ')'
    }
    out += suffix

    // Clean dangling punctuation left adjacent to the synthesized closers:
    //   trailing comma  → `{"a":1,}`  / `[1,2,]`
    //   dangling colon  → `{"a":}`    / `[1,:]`
    //   bare object key → `{"a":1,"k"}` / `{"k"}`
    return out
        .replace(/,(\s*[\}\]\)])/g, '$1')
        .replace(/:(\s*[\}\]\)])/g, ':null$1')
        .replace(/,\s*"(?:[^"\\]|\\.)*"(\s*\})/g, '$1')
        .replace(/(\{)\s*"(?:[^"\\]|\\.)*"(\s*\})/g, '$1$2')
}

/**
 * Structurally complete a partial JSON string so `JSON.parse` succeeds.
 * Returns the completed string, or `null` if it cannot be made valid.
 */
export function repairPartialJson(input: string): string | null {
    if (input.trim() === '') return null

    const candidate = complete(input)
    try {
        JSON.parse(candidate)
        return candidate
    } catch {
        // Fall back to trimming trailing fragments (e.g. a half-written
        // number like `1.`) and re-completing each prefix.
        for (let k = input.length - 1; k > 0; k--) {
            const rebuilt = complete(input.slice(0, k))
            try {
                JSON.parse(rebuilt)
                return rebuilt
            } catch {
                // keep trimming
            }
        }
        return null
    }
}

/**
 * Complete a streaming flavored-Markdown source so its trailing
 * `:::`-fenced Visualizer block can be parsed and rendered live.
 */
export function repairStreamingMarkdown(source: string): string {
    const matches = [...source.matchAll(FENCE_LINE)]
    // Fences pair sequentially (opener, closer, opener, closer, …).
    // An odd count means the final opener is still awaiting its closer.
    if (matches.length % 2 === 0) return source

    const last = matches[matches.length - 1]
    const openerEnd = (last.index ?? 0) + last[0].length
    const head = source.slice(0, openerEnd)
    const inner = source.slice(openerEnd).replace(/^\n/, '')

    const repaired = repairPartialJson(inner)
    if (repaired === null) {
        // Can't safely complete — drop the open fence from the preview.
        return head.slice(0, (last.index ?? 0))
    }

    return `${head}\n${repaired}\n:::`
}
