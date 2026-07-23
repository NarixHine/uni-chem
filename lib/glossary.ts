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
        aliases: ['亲电试剂', '亲电'],
        definition:
            '**亲电反应**\n\n' +
            '亲电反应是一类由亲电试剂进攻底物富电子部位而发生的反应。\n\n' +
            '亲电试剂是能接受电子对的试剂，如 $\\text{H}^+$、$\\text{Br}_2$、$\\text{NO}_2^+$，可看作路易斯酸。',
    },
    {
        term: '亲核反应',
        aliases: ['亲核试剂', '亲核'],
        definition:
            '**亲核反应**\n\n' +
            '亲核反应是一类由亲核试剂进攻底物带正电或缺电子部位而发生的反应。\n\n' +
            '亲核试剂是能提供电子对的试剂，如 $\\text{OH}^-$、$\\text{NH3}$、$\\text{Cl}^-$，可看作路易斯碱。原子核带正电，异性相吸，故名。',
    },
    {
        term: '部分电荷',
        aliases: ['部分正电荷', '部分负电荷'],
        definition:
            '**部分电荷**\n\n' +
            '部分电荷是（由于电负性差异、诱导效应、共轭效应等）分子内电子云偏移，导致共价键中各个原子上出现的、数值上小于一个基本电荷的正或负电荷。\n\n' +
            ':::\n{  \"m\": [{    \"a\": [      {\"x\": 65, \"y\": 80, \"l\": \"C\"},      {\"x\": 100, \"y\": 100, \"l\": \"C\", \"i\": \"c1\", \"clr\": \"var(--chem-rust)\"},      {\"x\": 100, \"y\": 145, \"l\": \"O\", \"p\": 2, \"i\": \"o2\", \"clr\": \"var(--chem-blue)\"},      {\"x\": 135, \"y\": 80, \"l\": \"C\"},      {\"x\": 120, \"y\": 100, \"l\": \"δ+\", \"clr\": \"var(--chem-rust)\"},      {\"x\": 120, \"y\": 145, \"l\": \"δ-\", \"clr\": \"var(--chem-blue)\"}    ],    \"b\": [      {\"b\": 0, \"e\": 1},      {\"b\": 1, \"e\": 2, \"o\": 2},      {\"b\": 1, \"e\": 3}    ]  }]}\n:::',
    },
    {
        term: '共轭效应',
        aliases: ['共轭'],
        definition:
            '**共轭效应**\n\n' +
            '共轭效应指 $π$ 电子或孤对电子与相邻 $p$ 轨道或 $π$ 键平行重叠，使 $π$ 电子或孤对电子在整个共轭体系中离域，从而降低体系能量、使分子趋于稳定的电子效应。\n\n' +
            '共轭效应的作用**可以通过共振理论描述**，详见[「共振理论」](/learn/resonance)[「共轭效应」](/learn/conjugation)。',
    },
    {
        term: '形式电荷',
        aliases: ['形式正电荷', '形式负电荷'],
        definition:
            '**形式电荷**\n\n' +
            '形式电荷是假设每个共价键的电子在两原子间均分（与电负性无关），由此算出的某个原子“账面上”带有的电荷。它只是一种电子计数工具，不反映原子实际带电多少。\n\n' +
            '$$\\text{FC} = \\text{V} - \\text{N} - \\tfrac{1}{2}\\,\\text{B}$$\n\n' +
            '上述计算公式的含义为：**形式电荷** $\\text{FC}$ 等于原子**价电子数**（与族数相同，即维持电中性所需的最外层电子数）$\\text{V}$ 减去**孤对电子数** $\\text{N}$ 和**成键数**（即成键电子的一半）$\\tfrac{1}{2}\\,\\text{B}$。',
    },
    {
        term: '进攻',
        aliases: [],
        definition:
            '**进攻**\n\n' +
            '“进攻”指带有特定电荷或电子特性的反应物向反应中心“靠近”并触发化学键形成的过程。',
    },
    {
        term: '键级',
        aliases: [],
        definition:
            '**键级**\n\n' +
            '键级反映两原子间共享电子对的数目，单键、双键、三键的键级分别为 $1$、$2$、$3$；离域体系中可为非整数，如苯的碳碳键键级为 $1.5$。\n\n' +
            '详见[「键级」](/learn/bond-order)。',
    },
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
