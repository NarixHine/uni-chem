export interface GlossaryEntry {
    /** Raw term string exactly as it appears in the article source. */
    term: string
    /** Flavored Markdown rendered inside the Glance overlay. */
    definition: string
}

// Terms are matched verbatim against the raw Markdown string the article feeds
// to <Markdown>. Post sources are authored as template literals, so a sequence
// such as `\\text` is evaluated by JavaScript (here: `\t` → a tab) before the
// string ever reaches Markdown. To stay consistent with that authoring
// convention, terms are written with single backslashes exactly as they appear
// in a post's source — a verbatim copy from a post always matches.
//
// Definitions also use single backslashes, but only KaTeX commands that are NOT
// JavaScript string escapes (`\mathrm`, `\alpha`, …) so they render correctly.
// Avoid `\\text` / `\b*` / `\f*` / `\n*` / `\r*` / `\v*` inside definitions.
export const glossary: GlossaryEntry[] = [
    {
        term: '亲电反应',
        definition:
            '**亲电反应**（electrophilic reaction）是一类由亲电试剂进攻底物富电子部位而发生的反应。\n\n' +
            '亲电试剂是能接受电子对的缺电子物种，如 $\\text{H}^+$、$\\text{Br}_2$、$\\text{NO}_2^+$。'
    },
    {
        term: '$α\\text{-H}$',
        definition:
            '$α\\text{-H}$ 指与官能团直接相连的碳原子上的氢原子。\n\n' +
            '由于羰基 $\\text{C=O}$ 是强吸电子基团，α-碳上的 $\\text{C-H}$ 键电子云被拉向羰基，使 α-H 的酸性显著增强。'
    },
]

const REGEXP_SPECIAL = /[.*+?^${}()|[\]\\]/g

function escapeRegExp(value: string): string {
    return value.replace(REGEXP_SPECIAL, '\\$&')
}

// Longer terms first so that, at any given position, the most specific match
// wins (e.g. `$α\\text{-H}$` is preferred over a hypothetical shorter `$α$`).
const glossaryPattern = (() => {
    if (glossary.length === 0) return null
    const terms = glossary
        .map(entry => entry.term)
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExp)
    return new RegExp(terms.join('|'), 'g')
})()

/**
 * Wraps the first appearance of each glossary term with `<glance data="…" />`.
 * Subsequent occurrences of the same term are left as plain text.
 *
 * MUST run before math/visualizer/quiz preprocessing: once `$…$` is converted
 * to `<inlinemath>` tags, a KaTeX-wrapped term (e.g. `$α\\text{-H}$`) would no
 * longer exist as a contiguous substring and could not be matched.
 *
 * The tag is lowercase because markdown-to-jsx treats a PascalCase custom tag
 * at the start of a block line as an HTML block: a self-closing `<Glance … />`
 * is misread as an opening tag, so everything trailing it on the paragraph is
 * captured as its children and dropped (Glance renders no children). Lowercase
 * custom tags are not recognized as HTML blocks, so they stay inline and
 * self-close correctly. See components/markdown/flavor.tsx for the matching
 * override registration.
 */
export function preprocessGlossary(source: string): string {
    if (!glossaryPattern) return source
    glossaryPattern.lastIndex = 0
    const seen = new Set<string>()
    return source.replace(glossaryPattern, match => {
        if (seen.has(match)) return match
        seen.add(match)
        return `<glance data="${encodeURIComponent(JSON.stringify(match))}" />`
    })
}

export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
    return glossary.find(entry => entry.term === term)
}
