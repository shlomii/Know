# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Dev server on :3000
npm run build            # Production build (runs prisma generate first)
npm run lint             # ESLint
npm run db:push          # Push schema changes to DB (no migration)
npm run db:migrate       # Create and apply migration (interactive)
npm run db:seed          # Seed admin user + badges
npm run db:studio        # Prisma Studio GUI
```

**Setup from scratch:**
```bash
npm install && npm run db:push && npm run db:seed && npm run dev
```

**No test framework is configured.** Lint is the only automated check.

## Environment

Requires `.env` with: `DATABASE_URL` (PostgreSQL), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ANTHROPIC_API_KEY`. See `.env.example`.

## Architecture

Next.js 16 full-stack app (App Router) — a learning platform where operators upload documents, AI generates structured courses, and learners consume them with gamification.

### Route Groups
- `/(auth)` — Login/register pages
- `/(dashboard)` — Learner-facing: dashboard, courses, lessons, quizzes, leaderboard, profile
- `/admin` — Operator-facing: upload, generation status, course editing
- `/api` — All backend logic lives in API route handlers

### Core Pipeline (`src/lib/ai/`)
The AI course generation pipeline (`pipeline.ts`) is the central feature:
1. **Analyze** source text → structured course outline (modules + lessons)
2. **Generate** lesson content (markdown + SVG visualization + key takeaways) per lesson
3. **Generate** quiz questions per module (multiple choice, true/false, fill-blank)
4. **Validate** SVG content (sanitize, fallback generation)
5. **AI Review** — 3 rounds of simulated student feedback → author revision cycles

Progress is tracked via `course.generationProgress` field and `CourseStatus` enum: `DRAFT → GENERATING → IN_REVIEW → PUBLISHED`.

### Auth
NextAuth.js with credentials provider (email/password, bcrypt). JWT sessions (30-day). Two roles: `ADMIN` (operator) and `LEARNER`. Guard helpers: `requireAuth()` and `requireAdmin()` in `src/lib/auth/helpers.ts`.

### Database
PostgreSQL + Prisma ORM. Schema in `prisma/schema.prisma` (11 models). Prisma client singleton in `src/lib/db.ts`.

### UI
shadcn/ui (new-york style) + Radix primitives + Tailwind CSS 4. Components in `src/components/ui/`. Layout components (header, sidebar, mobile-nav) in `src/components/layout/`.

### Key Libraries
- `@anthropic-ai/sdk` — Claude API (sonnet model) with retry logic and JSON extraction
- `pdf-parse` — PDF text extraction for upload
- `zustand` — Client state management
- `react-markdown` + `rehype-highlight` — Lesson content rendering
- `@dnd-kit` — Drag-and-drop for course editing

### Gamification
XP system: lessons (+10 XP), quizzes (+25 base + 5 per correct), perfect quiz bonus (+50). Level formula: `floor(sqrt(XP/25)) + 1`. Daily streaks tracked. 12 predefined badges.

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json).

### Seed Data
`npm run db:seed` creates admin user (`admin@know.app` / `admin123`) and 12 achievement badges.
