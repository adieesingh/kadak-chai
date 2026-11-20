# #MyChaiBreak (Kadak Chai Co.)

Campaign microsite for a fictional brand: people submit a chai-break story, an LLM approves or rejects it, tags it and writes a poster caption, approved entries get a private shareable page, and the brand team reviews everything in an admin dashboard.

> Replace every **TODO**. Run the setup steps below from a fresh clone before you submit, so the "under 10 minutes" promise is true.

**Live link:** TODO (or "not deployed")
**Time spent:** TODO hours

## Stack

Next.js (App Router) + TypeScript, Prisma + SQLite, Zod, Vitest, Tailwind. TODO: correct this if anything differs.

## Run locally

```bash
git clone TODO
cd TODO
npm install
cp .env.example .env        # defaults work: AI_PROVIDER=mock needs no key
npx prisma migrate dev
npm run dev                 # http://localhost:3000
npm test
```

Admin: `http://localhost:3000/admin` (credentials from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`).

## Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection string (`file:./dev.db` for SQLite) |
| `AI_PROVIDER` | `mock` = no API key, predictable output. Anything else = real provider |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Any OpenAI-compatible endpoint (Groq, OpenRouter, Gemini compat, Ollama) |
| `AI_TIMEOUT_MS` | AI call timeout, default 8000 |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Admin login |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie (16+ chars) |

## Mock mode

`AI_PROVIDER=mock` approves clean chai stories, rejects spam/abuse/off-topic ones, and picks a category by keywords. To exercise failure paths, include one of these in a story:

| Trigger | Simulates | Saved as |
|---|---|---|
| `[mock:timeout]` | timeout | `pending_review` |
| `[mock:ratelimit]` | HTTP 429 | `pending_review` |
| `[mock:garbage]` | non-JSON reply | `pending_review` |
| `[mock:badvalues]` | valid JSON, wrong values | `pending_review` |

**Real provider:** TODO. Say which provider/model you tested with, or: "I could not get a free key to work, so only mock mode was tested."

## How it works

1. `POST /api/entries` validates input with Zod (same schema as the form), normalises the contact, and inserts the entry as `pending_review` **before** calling the AI, so no submission is ever lost.
2. `moderateStory()` calls the provider with a timeout, extracts JSON (tolerating markdown fences), and validates it against a Zod schema (decision, category, caption of 12 words or fewer, reason required when rejected). It never throws; any failure becomes `{ ok: false, error }`.
3. On success the entry becomes `approved` or `rejected`. On any failure it stays `pending_review` and the error is stored in `aiError`. The user only ever sees "Thanks! We're reviewing your entry."
4. Approved entries are served at `/entry/<random slug>` showing first name and caption only.
5. `/admin` lists entries, filters by status and category, and lets the brand team override the decision. Overrides are logged in `entry_events`.

## Decisions and why

- **Insert first, AI second.** A crash or timeout cannot lose a submission.
- **`status` vs `aiDecision`.** `status` is the final truth; `aiDecision`/`aiCaption` keep what the AI said, so overrides are auditable.
- **Random slug, separate from the internal id.** `crypto`/`nanoid` token; `/entry/1` style URLs do not exist. The page queries `status = approved` and selects only `name` and `aiCaption`; anything else is a 404 and nothing else is exposed.
- **Rejection reason is never shown to the user.** Only the admin sees it.
- **Prompt-injection handling.** The story is wrapped in `<story>` tags and treated as data, the delimiter is stripped from user text, and the output must pass the schema. This reduces risk but cannot eliminate it; the admin override is the backstop.
- **Admin auth without a user table.** Env credentials, constant-time compare, HMAC-signed `httpOnly` `SameSite=Strict` cookie with an 8-hour expiry, fail closed if env is missing.
- **Approving an entry without an AI caption requires a caption**, otherwise its public page would 404.
- **Duplicate contacts:** unique index on the normalised contact; the 409 comes from the DB constraint (`P2002`), which also handles races. Note this blocks a rejected user from re-entering. TODO: confirm this matches what you built.

## Assumptions

- Names are unverified (no email/phone verification was required), so the admin dashboard is the safeguard against someone using another person's name.
- Result pages show first name + caption only; email, phone, city and story are never public.
- TODO: add the phone-number assumption (India-only mobiles, or any 10-13 digit number) once you decide.

## Known limitations / unfinished

- Admin login rate limit is in-memory (resets on restart, not shared across instances). A real deployment would use Redis.
- Admin sessions are stateless, so logging out does not invalidate an old cookie before it expires.
- Admin note/caption entry uses `window.prompt` (basic UI).
- TODO: tick what you actually did

Nice-to-have status:

- [ ] Live deployment
- [ ] Per-IP submission rate limit
- [ ] Duplicate email/phone block (unique index)
- [ ] CSV export
- [x] Category filter in admin
- [ ] Poster-style result page / Open Graph image
- [ ] Hindi toggle
- [ ] Docker

## Tests

`npm test` runs Vitest. Covered: AI response parser (valid, fenced, truncated, malformed JSON, wrong enum values, caption over 12 words, missing fields), `moderateStory` error mapping (timeout, 429, provider error, network error, garbage), mock mode, admin session tokens (tampered, expired, wrong secret), override rules, form validation.

## AI usage

See [AI_USAGE.md](AI_USAGE.md), [AI_SESSIONS.json](AI_SESSIONS.json) and `ai-logs/`.
