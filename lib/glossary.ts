export interface GlossaryEntry {
    /** Raw term string exactly as it appears in the article source. */
    term: string
    /** Alternate spellings of the same term; each is matched independently but
     *  resolves to this entry. Only the first appearance of the entry (across
     *  the term and all its aliases) is wrapped in a Glance. */
    aliases?: string[]
    /** Flavored Markdown rendered inside the Glance overlay. */
    definition: string
}

export const glossary: GlossaryEntry[] = [
    {
        term: '亲电反应',
        aliases: ['亲电试剂'],
        definition:
            '**亲电反应**\n\n' +
            '亲电反应是一类由亲电试剂进攻底物富电子部位而发生的反应。\n\n' +
            '亲电试剂是能接受电子对的路易斯酸，如 $\\text{H}^+$、$\\text{Br}_2$、$\\text{NO}_2^+$。',
    },
    {
        term: '部分电荷',
        aliases: ['部分正电荷', '部分负电荷'],
        definition:
            '**部分电荷**\n\n' +
            '部分电荷是由于分子内电子云密度分布不均，导致共价键中各个原子上出现的、数值上小于一个基本电荷的正或负电荷。'
    }
]

const REGEXP_SPECIAL = /[.*+?^${}()|[\]\\]/g
const escapeRegExp = (value: string) => value.replace(REGEXP_SPECIAL, '\\$&')

/** One matchable string (canonical term or alias) bound to its entry. */
interface Matchable {
    entry: GlossaryEntry
    /** Original (un-escaped) string, used to look up the entry from a match. */
    source: string
    /** Escaped form stitched into the combined RegExp. */
    escaped: string
}

const matchables: Matchable[] = []
for (const entry of glossary) {
    matchables.push({ entry, source: entry.term, escaped: escapeRegExp(entry.term) })
    for (const alias of entry.aliases ?? []) {
        matchables.push({ entry, source: alias, escaped: escapeRegExp(alias) })
    }
}
// Longest first so e.g. `$α\text{-H}$` wins over a shorter overlapping alias.
matchables.sort((a, b) => b.escaped.length - a.escaped.length)

const pattern = matchables.length ? new RegExp(matchables.map(m => m.escaped).join('|'), 'g') : null

/** Direct string → entry map for O(1) lookup from both match strings and terms. */
const stringToEntry = new Map<string, GlossaryEntry>()
for (const m of matchables) stringToEntry.set(m.source, m.entry)

/**
 * Wraps the first appearance of each glossary entry (term or any alias) with
 * `<glance data="…" />`. Subsequent occurrences of the same entry — whether
 * the canonical term or an alias — are left as plain text.
 *
 * MUST run before math/visualizer/quiz preprocessing: once `$…$` is converted
 * to `<InlineMath>` tags, a KaTeX-wrapped term (e.g. `$α\text{-H}$`) would no
 * longer exist as a contiguous substring and could not be matched.
 *
 * The tag is lowercase because markdown-to-jsx treats a PascalCase custom tag
 * at the start of a block line as an HTML block. See components/markdown/flavor.tsx
 * for the matching override registration.
 */
export function preprocessGlossary(source: string): string {
    if (!pattern) return source
    pattern.lastIndex = 0
    const seen = new Set<GlossaryEntry>()
    return source.replace(pattern, match => {
        const entry = stringToEntry.get(match)
        if (!entry || seen.has(entry)) return match
        seen.add(entry)
        return `<glance data="${encodeURIComponent(JSON.stringify(match))}" />`
    })
}

export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
    return stringToEntry.get(term)
}
