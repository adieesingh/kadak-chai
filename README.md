# #MyChaiBreak (Kadak Chai Co.)

Campaign microsite for a fictional brand. People submit a short chai-break story, an LLM approves or rejects it, tags it and writes a one-line poster caption, approved entries get a private shareable page, and the brand team reviews everything in an admin dashboard.

**Live link:** https://kadak.adarshdev.pro  
**Repo:** https://github.com/adieesingh/kadak-chai  
**Time spent:** 10 hours  

## Stack

Next.js 16 (App Router) + TypeScript, Prisma 7 + PostgreSQL, Zod, Vitest, Tailwind CSS. Optional: Upstash Redis for rate limiting, Docker.

## Run locally (about 5 minutes, no API key needed)

You need Node 22+, npm and a PostgreSQL database. The quickest way to get Postgres is the `db` service in `docker-compose.yml`.

```bash
git clone https://github.com/adieesingh/kadak-chai.git
cd kadak-chai
npm install
cp .env.example .env          # defaults work: AI_PROVIDER=mock needs no key
docker compose up db -d       # starts Postgres on localhost:5432
npx prisma migrate dev        # creates the tables / runs migrations
npm run dev                   # http://localhost:3000
npm test                      # unit tests, no database or API key needed
```

- No Docker? Use any Postgres (a free Neon database works) and put its connection string in `DATABASE_URL` in `.env`.
- Admin page: http://localhost:3000/admin. Credentials are `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`.

### Run everything in Docker (optional)

Docker is completely optional; for quick evaluation, the local setup above is recommended.

```bash
cp .env.example .env
# edit .env: set ADMIN_PASSWORD (12+ characters) and ADMIN_SESSION_SECRET (long random string)
docker compose up --build -d
npx prisma migrate deploy     # run once from your machine; the image does not run migrations
```

The Docker image runs in production mode, so it requires an `ADMIN_PASSWORD` of 12+ characters (rejects empty or `change-me`). Open http://localhost:3000.

## Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://kadak:kadakpass@localhost:5432/kadakchai?schema=public`) |
| `AI_PROVIDER` | `mock` = no API key, predictable fake output. Anything else = real provider |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Any OpenAI-compatible endpoint (Groq, OpenRouter, Gemini compatibility endpoint, Ollama) |
| `AI_TIMEOUT_MS` | AI call timeout in ms, default 8000 |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Admin login. In production the password must be 12+ characters and not empty or `change-me` |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie (16+ characters) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional. Shared rate limiting. Without them an in-memory limiter is used |

## Mock mode

`AI_PROVIDER=mock` approves clean chai stories, rejects spam, abuse and off-topic stories, and picks a category from keywords. To exercise the failure paths, put one of these in a story:

| Trigger | Simulates | Saved as |
|---|---|---|
| `[mock:timeout]` | timeout | `pending_review` |
| `[mock:ratelimit]` | HTTP 429 | `pending_review` |
| `[mock:garbage]` | non-JSON reply | `pending_review` |
| `[mock:badvalues]` | valid JSON, wrong values | `pending_review` |

**Real provider:** Tested with Groq (`llama-3.3-70b-versatile`) via OpenAI-compatible endpoint as well as `AI_PROVIDER=mock`. Both work seamlessly; mock mode is default for quick local setup without requiring API keys.

To use a real provider, set for example `AI_PROVIDER=groq`, `AI_BASE_URL=https://api.groq.com/openai/v1`, `AI_API_KEY=<your key>` and `AI_MODEL=llama-3.3-70b-versatile`. Any value other than `mock` uses the OpenAI-compatible client. Free tiers have tight rate limits; a rate-limit error is treated like any other AI failure.

## How it works

1. `POST /api/entries` first checks the per-IP rate limit, then validates the body with Zod (the form uses the same schema), normalises the contact, and inserts the entry as `pending_review` **before** calling the AI, so a crash or timeout never loses a submission.
2. `moderateStory()` calls the provider with a timeout, extracts the JSON (tolerating markdown fences and extra text), and validates it against a Zod schema: `decision` is approved or rejected, `category` is one of funny / nostalgic / wholesome / other, the caption has 12 words or fewer, and a reason is required when rejected. It never throws; every failure becomes `{ ok: false, error }`.
3. On success the entry becomes `approved` or `rejected`. On any failure (timeout, HTTP error, rate limit, bad JSON, wrong values) it stays `pending_review` and the error code is stored in `aiError`. The visitor never sees a technical error. Anything that is not approved shows "Thanks! We're reviewing your entry."
4. Approved entries are served at `/entry/<random slug>` and show the first name and the caption only.
5. `/admin` lists entries (latest 200), filters by status and category, and lets the brand team override the decision. Every override is saved in the `EntryEvent` table with who, when and the old and new status.

## Project structure

```
app/api/entries/route.ts        public submit endpoint
app/api/admin/...               login, logout, list/override (admin only)
app/entry/[slug]/page.tsx       result page
app/admin/                      dashboard UI
app/lib/ai/                     provider interface, mock + OpenAI-compatible providers, prompt, parser, schema
app/lib/admin/                  session token, guard, override rules
app/lib/validation.ts           form schema + contact normalisation
app/lib/ratelimit.ts            Upstash limiter with in-memory fallback
prisma/                         schema and migrations
tests/                          Vitest tests
```

## Decisions and why

- **Insert first, AI second.** The entry is saved before the AI call, so no submission is lost if the AI fails.
- **`status` vs `aiDecision`.** `status` is the final truth; `aiDecision`, `aiCategory` and `aiCaption` keep what the AI said, so overrides are auditable. `aiRaw` keeps the raw model reply (first 2000 characters) when parsing fails.
- **Random slug, separate from the internal id.** `nanoid(16)`; URLs like `/entry/1` do not exist. The page validates the slug format, queries `status = approved` and selects only `name` and `aiCaption`. Anything else is a 404 and nothing else is exposed.
- **Rejection reason is never shown to the visitor.** Only the admin sees it.
- **Prompt-injection handling.** The story is wrapped in `<story>` tags and treated as data, the delimiter is stripped from user text, and the output must pass the schema. This reduces the risk but cannot remove it; the admin override is the backstop.
- **Admin auth without a user table.** Credentials from env, constant-time compare, an HMAC-signed `httpOnly`, `SameSite=Strict` cookie (8-hour expiry, `Secure` in production), failing closed if the env is missing. Every admin API route checks the session on the server, not only in the UI.
- **Admin login is rate limited** (5 attempts per 10 minutes per IP). **Submissions are rate limited** (5 per hour per IP). Only a hash of the IP is stored.
- **Duplicate contacts:** a unique index on the normalised contact. The 409 comes from the database constraint, so it also holds under races. This also blocks a rejected visitor from entering again.
- **Approving an entry that has no AI caption requires the admin to type one**, otherwise its public page would 404.
- **Security headers** (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) are set for all routes in `next.config.ts`.
- **The AI call runs inside the request** with a timeout. It is simple and gives an approved visitor an instant share link. A production version would use a queue.

## Assumptions

- Names are unverified (no email or phone verification), so the admin dashboard is the safeguard against someone using another person's name. The AI moderates the story only, not the name.
- Result pages show first name + caption only. Email, phone, city and story are never public.
- Phone numbers: 10 to 13 digits, optional leading `+`, spaces, dashes and brackets are ignored. It is not India-only.
- Email is lower-cased before the duplicate check.

## Known limitations / unfinished

- Duplicate detection is exact. `a.b@gmail.com` vs `ab@gmail.com`, `+91 98765 43210` vs `98765 43210` count as different contacts.
- Without Upstash the rate limiter is in memory (resets on restart, not shared between instances). The client IP is read from `x-forwarded-for` / `x-real-ip`, so it is only as trustworthy as the proxy in front of the app.
- Admin sessions are stateless, so logging out does not invalidate an old cookie before it expires.
- The Docker image does not run database migrations (see "Run everything in Docker").
- The admin list shows the latest 200 entries, with no pagination.
- Not built: CSV export, Hindi toggle, Open Graph image (the result page only sets Open Graph text tags).

Nice-to-have status:

- [x] Live deployment
- [x] Per-IP submission rate limit
- [x] Duplicate email/phone block (unique index)
- [ ] CSV export
- [x] Category filter in admin
- [x] Poster-style result page
- [ ] Open Graph image
- [ ] Hindi toggle
- [x] Docker

## Tests

`npm test` runs Vitest: 76 tests in 7 files. They need no database and no API key.

- `parse.test.ts`: AI response parser. Valid, fenced, truncated and malformed JSON, wrong enum values, caption over 12 words, missing fields.
- `moderate.test.ts`: `moderateStory` error mapping (timeout, 429, provider error, network error, garbage) and mock mode.
- `session.test.ts`: admin session tokens (tampered, expired, wrong secret) and credential checks.
- `override.test.ts`: admin override rules.
- `validation.test.ts`: form validation and contact normalisation.
- `ratelimit.test.ts`: in-memory rate limiters.
- `security.test.ts`: security headers are configured.

## AI usage

See [AI_USAGE.md](AI_USAGE.md), [AI_SESSIONS.json](AI_SESSIONS.json) and the `ai-logs/` folder.
