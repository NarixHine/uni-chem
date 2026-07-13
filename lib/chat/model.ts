/**
 * Model selection for the chat backend.
 *
 * `google/gemini-3.5-flash` is a fast, inexpensive model with solid
 * output (ChemDoodle molecules) and strong chemistry reasoning, both
 * critical for the flavored-Markdown + Visualizer pipeline.
 */
export const CHAT_MODEL = 'google/gemini-3.5-flash'
