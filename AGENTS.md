<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-agent-rules -->
- Always use bun as the package manager.
- Always use (already-styled) HeroUI v3 components where possible instead of HTML primitives.
- Always write quality, clean, modular (but don't over do it, so always inline Tailwind), maintainable code.
- Always place direct database access code in `/db`, and place service layer (`next-safe-actions`) in `/service`.
- Always write maintainable, performant React code; regard useEffect as bad React code.
<!-- END:project-agent-rules -->
