# AI_USAGE.md

## 1. Tools and models

| Tool | Model | Used for |
|---|---|---|
| Claude (claude.ai chat) | Claude 5.5 Sonnet | Explaining the brief, DB schema design, entry API route, AI layer (`app/lib/ai/*`), result page, admin dashboard, entry form, tests |
| Antigravity (Google DeepMind) | Gemini 3.8 Pro / Flash | Next.js 16 migration, complete UI/UX overhaul, dark mode theme bugfix, security audit, and Upstash Redis distributed rate limiting |

I'm a Node.js developer who had not built an LLM-moderation flow before, so I used Claude both to learn the design and to generate a first version of most files, then ran and reviewed them. Later, I used Antigravity to modernize the codebase to Next.js 16, revamp the UI/UX, and harden security.

## 2. Prompts that mattered

These are my real messages from the session, copied as written (Hinglish):

1. **Understanding the brief first**
   > explain this project in details, and kya kya challenge raha ga

   Why it mattered: it gave me the list of risks (untrusted AI output, server-side validation, unguessable URLs, mock mode) that I then built around.

2. **Security thinking about the result page**
   > ismai ek problem dekh raha muhje jab llm maan lo ek user accepted wala json diya then ushko shareable page bhi dena pada ga q ki woh approved hua ,agar koi third person link mai aapna name change karke use bhi kar sakthw woh wala page ?

   Why it mattered: led to the decision that the URL carries only a random slug, content is always read from the DB, and only `approved` entries are served (anything else is a 404).

3. **Database design**
   > what will database look like ,kitna table bana pada ga and kya kaya purpose he .i need full understanding

   Why it mattered: produced the `entries` / `entry_events` design and the split between `status` (final truth) and `aiDecision` (what the AI said), so admin overrides never erase the AI's original output.

4. **Catching a schema error**
   > table 1  aapna entry_events[] nhi likha woh ek error he

   Why it mattered: this was a real Prisma validation error (see section 3).

5. **Catching a missing requirement**
   > u didnt gave me user can fille the form?

   Why it mattered: the AI had skipped required item #1 (landing page and form).

## 3. Times the AI got something wrong

1. **Missing back-relation in the Prisma schema.**
   The AI defined `EntryEvent.entry @relation(...)` but did not add `events EntryEvent[]` on `Entry`. Prisma requires both sides, so the schema fails validation.
   *How I caught it:* I noticed while reading the schema. The fix was adding the opposite field; `npx prisma validate` is the check.

2. **Forgot a required deliverable.**
   The AI built the API, AI layer, result page and admin dashboard but never built the landing page and entry form, which is required item #1.
   *How I caught it:* I tried to follow the flow as a user and there was no form, so I asked for it.

3. **Weak phone normalisation (duplicate check bypass).**
   The first `normalizeContact` only stripped spaces and dashes, so `9876543210`, `+919876543210` and `09876543210` were treated as three different contacts and the unique index would not stop duplicates.
   *How I caught and handled it:* I asked the AI to explain the function and the weakness came out. I updated the normalization to strip non-digits, trim leading prefixes, and documented remaining edge cases (e.g. Gmail aliases and formatting variations) in README as known limitations.

4. **Dark mode CSS override broke card contrast.**
   The AI initially retained a `prefers-color-scheme: dark` media query in `globals.css` that forced dark background while card text was also dark, resulting in black-on-black unreadable submissions on dark mode devices.
   *How I caught it:* Visual testing in a dark mode browser environment. Fixed by removing the media query and locking colors to the warm chai palette (`#FAF7F2` / `#1C1917`).

5. **OverrideControls useEffect missing dependency.**
   The AI created a modal keyboard escape listener in `OverrideControls.tsx` calling `closeModal` without declaring it in `useEffect` dependencies, triggering an ESLint `react-hooks/exhaustive-deps` warning.
   *How I caught it:* Ran `npm run lint` and resolved it by wrapping `closeModal` in `useCallback`.

## 4. Parts I wrote or rewrote by hand

- **Schema fixes:** Added missing `events EntryEvent[]` relation on `Entry` model in `prisma/schema.prisma`.
- **Input validation:** Added `.trim()` to `name` in `app/lib/validation.ts` to reject whitespace-only names.
- **Security & Guard:** Added `try/catch` fail-closed pattern in `app/lib/admin/guard.ts` and configured security headers with CSP in `next.config.ts`.
- **Admin UX & Lint:** Added `useCallback` to `closeModal` in `app/admin/OverrideControls.tsx` to resolve React hook dependency warning, and redesigned status action buttons.
- **Documentation & Env:** Comprehensive README setup instructions, `.env.example` configuration with Postgres and Upstash, and deployment notes.

## 5. How I checked AI-generated code

- `npx prisma validate` and `npx prisma migrate dev` for the schema
- `npx tsc --noEmit` for type errors
- `npm test` for the AI response parser and the admin session/override logic (76 Vitest unit tests pass across 7 test suites covering AI parsing, moderation fallback, session security, rate limiting, and validation). Tests AI ne generate kiye, maine padh kar chalaye aur verify kiye.
- `curl` against `/api/entries` with bad input (no consent, 301 characters, duplicate email, extra `status` field)
- Mock-mode failure triggers (`[mock:timeout]`, `[mock:garbage]`, `[mock:badvalues]`, `[mock:ratelimit]`) to confirm failures become `pending_review`
- Tested with Groq API (`llama-3.3-70b-versatile`) using OpenAI-compatible client, verifying valid JSON moderation as well as mock mode failure fallbacks.
