# Projectile

Projectile is a focused Microsoft Project-inspired MVP for project planning:

Project -> WBS -> Tasks -> Durations -> Dependencies -> Automatic Scheduling -> Gantt

It intentionally excludes authentication, collaboration, Kanban, comments, notifications, billing, and other platform concerns.

## Tech stack

- Next.js App Router
- TypeScript and React
- Supabase PostgreSQL
- Tailwind CSS
- Vitest
- Playwright

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

3. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Run the SQL in `supabase/migrations/001_initial_schema.sql` against your Supabase database.

5. Start the app:

```bash
npm run dev
```

## Validation

```bash
npm run test
npm run build
npm run e2e
```

The Playwright workflow requires Supabase environment variables because persistent storage is Supabase-only.

## Scheduling semantics

See `src/lib/scheduling/README.md`.
