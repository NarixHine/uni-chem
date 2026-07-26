// Shared quiz-fence parsing and serialization. The flavored source fences a
// quiz as:
//
//   ||| one AB
//   Q
//   <question markdown>
//   A
//   <option A markdown>
//   B
//   <option B markdown>
//   Sol
//   <explanation markdown>
//   |||
//
// This module owns the body grammar (marker lines + intervening content) so
// both the article renderer (`components/markdown/flavor.tsx`) and the post
// editor (`components/post-editor/quiz-node.tsx`) round-trip identically.

import type { QuizData } from '@/components/quiz'

export const QUIZ_OPTION_MARKERS = ['A', 'B', 'C', 'D', 'E'] as const
export const QUIZ_MARKER_SEQUENCE = ['Q', 'Sol', ...QUIZ_OPTION_MARKERS] as const

export type QuizMode = QuizData['mode']

export interface ParsedQuizBody {
    question: string
    explanation?: string
    options: { letter: string; content: string }[]
}

/**
 * Parse the body of a `||| ... |||` fence (everything between the header line
 * and the closing `|||`) into structured sections. Markers must appear on
 * their own line, in the canonical order `Q`, `Sol`, `A`..`E`; `Sol` is
 * skippable in the sequence but the rest must be encountered in order.
 */
export function parseQuizBody(body: string): ParsedQuizBody {
    const lines = body.split('\n')
    const sections = new Map<string, string[]>()
    let currentMarker: string | null = null
    let seqIdx = 0

    for (const line of lines) {
        const trimmed = line.trim()
        let matched = false

        for (let i = seqIdx; i < QUIZ_MARKER_SEQUENCE.length; i++) {
            if (trimmed === QUIZ_MARKER_SEQUENCE[i]) {
                currentMarker = trimmed
                sections.set(currentMarker, [])
                seqIdx = i + 1
                matched = true
                break
            }
            if (QUIZ_MARKER_SEQUENCE[i] === 'Sol') continue
            break
        }

        if (!matched && currentMarker) {
            sections.get(currentMarker)!.push(line)
        }
    }

    const question = (sections.get('Q') ?? []).join('\n').trim()
    const explanation = (sections.get('Sol') ?? []).join('\n').trim() || undefined
    const options = QUIZ_OPTION_MARKERS.filter(l => sections.has(l)).map(l => ({
        letter: l,
        content: (sections.get(l) ?? []).join('\n').trim(),
    }))

    return { question, explanation, options }
}

/**
 * Serialize a structured quiz back into the fenced body (markers + content),
 * omitting empty sections so the output stays compact and round-trips cleanly
 * through `parseQuizBody`.
 */
export function serializeQuizBody(data: QuizData): string {
    const lines: string[] = ['Q']
    if (data.question.trim()) lines.push(data.question.trim())
    for (const opt of data.options) {
        lines.push(opt.letter)
        if (opt.content.trim()) lines.push(opt.content.trim())
    }
    if (data.explanation?.trim()) {
        lines.push('Sol')
        lines.push(data.explanation.trim())
    }
    return lines.join('\n')
}

/** Build the full `||| ... |||` fence for a quiz. */
export function serializeQuizFence(data: QuizData): string {
    return `||| ${data.mode} ${data.answer.toUpperCase()}\n${serializeQuizBody(data)}\n|||`
}

/** Encode a quiz as the `data-` payload used by the `<Quiz>` component. */
export function encodeQuizData(data: QuizData): string {
    return encodeURIComponent(JSON.stringify(data))
}

/** Default scaffold for a freshly inserted quiz. */
export function defaultQuiz(): QuizData {
    return {
        mode: 'one',
        answer: 'A',
        question: '',
        explanation: '',
        options: [
            { letter: 'A', content: '' },
            { letter: 'B', content: '' },
        ],
    }
}
