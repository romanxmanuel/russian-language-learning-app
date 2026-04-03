<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes in APIs, conventions, and file structure. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Russian Accelerator Project Context

- Product: internal prototype for an 8-week Russian accelerator aimed at English-speaking adult beginners.
- Promise: accelerated A2-ish speaking/listening foundation through better sequencing and feedback, not fake fluency claims.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Drizzle ORM, libSQL/Turso.
- Persistence rule: user profile and progress must survive restarts using a local database by default.
- Learning rule: the center of the product is the daily mission loop `Listen -> Recall -> Speak -> Read -> Reuse -> Reflect`.
- Modules that must exist in the UI: Pronunciation Lab, Chunk Forge, Input Theater, Conversation Dojo, Mission Review.
- Content rule: Russian is taught through chunks and functions first, with grammar introduced through usage.
