/**
 * Model selection for the chat backend.
 *
 * `google/gemini-3.6-flash` is a fast, inexpensive model with solid
 * output (ChemDoodle molecules) and strong chemistry reasoning, both
 * critical for the flavored-Markdown + Visualizer pipeline.
 */
export const CHAT_MODEL = 'google/gemini-3.6-flash'

/**
 * Smaller, cheaper model used for background tasks like generating a
 * concise conversation title from the opening exchange.
 */
export const TITLE_MODEL = 'google/gemini-3.1-flash-lite'
