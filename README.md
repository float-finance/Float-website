# Float — website

**On-chain short-term working capital for businesses whose money is delayed.**

Businesses rarely fail for lack of revenue. They fail because the revenue arrives late — a
customer invoice that settles in thirty days, a cross-border investor payment in flight, a
temporary banking block — while payroll, vendors and rent come due on schedule regardless.
That gap between money earned and money available is what Float lends against.

A verified business applies with evidence of its incoming funds. Float underwrites that
evidence and, on approval, disburses **USDC**. The loan, its repayment schedule and its
status are recorded on **Solana**, and each repayment builds a portable credit history that
qualifies the business for larger limits and better rates over time.

## What this repository is

**This repo is only the public website.** The lending product, underwriting and on-chain
programs live elsewhere and are not part of this codebase.

What's here today is the pre-launch page and the waitlist businesses use to register
interest:

- a single landing page (React + TypeScript + Vite, deployed on Vercel)
- a waitlist form that saves to a private Supabase Postgres table

## Local preview

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL to save submissions locally
npm run dev
```

Under `npm run dev`, Vite serves `/api/waitlist` with the same handler Vercel runs. Without
`DATABASE_URL` the form shows an error instead of saving.

```bash
npm test        # waitlist handler tests
npm run build   # production build
```

## Deployment

1. In Supabase, run the `db/` migrations once, in order, in the SQL editor. Take the
   connection string from Project Settings → Database → Connection string → **Transaction
   pooler**, and use it as `DATABASE_URL`.
2. Set `DATABASE_URL` as a **server-only** Vercel environment variable. Never commit it, and
   never prefix it with `VITE_`.
3. On the preview deployment, submit the form with a test email and confirm one row in
   `waitlist_entries`. Submit again to confirm the retry neither duplicates nor overwrites it.
   Delete only that known test row afterwards.

Rolling back means rolling the frontend and API back together to the previous Vercel
deployment. The `waitlist_entries` table is additive — leave it and its captured entries in
place.

## How the waitlist handles data

The form asks whether someone is joining as a user or a provider, their name (stored in the
`business` column), their email and, optionally, their X handle or website. The endpoint
validates each field, lowercases the email and stores one row per email; repeat submissions
are ignored rather than overwriting the first. After saving, the success dialog links to the
Float community on Telegram.

Emails are not verified. A hidden spam-trap field catches simple bots: if it is filled in, the
endpoint replies with success and saves nothing.

Supabase serves the `public` schema over PostgREST using a browser-safe anon key, so the
table is closed off explicitly: `db/003_signup_fields.sql` enables row-level security with no
policies and revokes `anon` and `authenticated`. Only the owning role this API connects as
can reach the rows. Verify this after running the migrations — an exposed table would leak
every signup email.

Rows saved under the earlier Privy sign-in keep their `privy_id`, and the unused `name` and
`community_interest` columns are left in place, so nothing captured earlier is lost.

The table has no public read endpoint and the browser never receives database credentials.
Any failure in configuration or persistence returns an error — the form never reports a
saved place that wasn't saved.

Logs carry a request ID and an event code only, never contact data. Watch
`waitlist.save_failed` in Vercel logs; if signup breaks, check `DATABASE_URL` and that the
migrations have run.

## Docs (`/docs`)

The product docs live in this repo as MDX and are served at `/docs`. They are a separate entry
(`docs.html` → `src/docs/`) so their styles can't touch the landing page.

- **Add a page:** create `src/docs/content/<path>.mdx` with frontmatter
  `title`, `subtitle`, `section` (sidebar group) and `order` (position). The file path is the URL:
  `content/guides/kyb.mdx` → `/docs/guides/kyb`. `get-started` is served at `/docs` itself.
  Internal links are written site-relative (`/overview#environments-and-access`) and mapped to `/docs/...`.
- **Components:** `Note`, `Warning`, `Tip`, `Info`, `Card`, `CardGroup`, `Tabs`/`Tab`, `Steps`/`Step`,
  `Accordion`/`AccordionGroup`, `CodeBlocks` and ```` ```mermaid ```` are in `src/docs/components.tsx`.
  Card icons use Font Awesome names; register new ones in `src/docs/icons.tsx`.
- **Build:** `npm run build` also prerenders every docs page to `dist/docs/**/index.html` and writes
  `sitemap.xml` and `robots.txt` (`scripts/prerender.mjs`). `npm run dev` serves `/docs` on the client.
