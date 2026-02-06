# Know - Task Tracker

> Each task below corresponds to a planned GitHub Issue.
> Format: `- [ ]` = open, `- [x]` = completed
> Labels: `P0` = critical, `P1` = important, `P2` = nice-to-have

---

## Phase 1: Project Foundation & Infrastructure

### Issue #1 — Initialize Next.js project with TypeScript and Tailwind
**Labels:** `P0`, `phase-1`, `setup`
**Description:**
Set up the base Next.js 14 project with App Router, TypeScript, Tailwind CSS, and shadcn/ui.

**Acceptance Criteria:**
- [ ] Next.js 14 project created with App Router enabled
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS installed and configured
- [ ] shadcn/ui installed with base components (Button, Card, Input, Dialog, Sheet, etc.)
- [ ] Project structure: `/app`, `/components`, `/lib`, `/prisma`, `/types`
- [ ] ESLint and Prettier configured
- [ ] Path aliases (`@/`) configured in tsconfig
- [ ] `npm run dev` starts without errors

**Status:** `open`

---

### Issue #2 — Set up PostgreSQL + Prisma ORM with full schema
**Labels:** `P0`, `phase-1`, `database`
**Description:**
Define the complete database schema in Prisma and set up PostgreSQL connection.

**Acceptance Criteria:**
- [ ] Prisma installed and configured
- [ ] Complete schema with all models:
  - `User` (id, email, passwordHash, name, avatarUrl, role, xp, level, streakCount, streakLastDate, createdAt)
  - `Course` (id, title, description, learningObjectives, status, sourceFilePath, sourceText, createdBy, createdAt, publishedAt)
  - `Module` (id, courseId, title, description, order, passingScore)
  - `Lesson` (id, moduleId, title, svgContent, contentMarkdown, keyTakeaways, order)
  - `QuizQuestion` (id, moduleId, type, questionText, options, correctAnswer, explanation, difficulty, order)
  - `UserProgress` (id, userId, lessonId, completedAt)
  - `QuizAttempt` (id, userId, moduleId, score, totalQuestions, answersJson, completedAt)
  - `Badge` (id, name, description, icon, criteriaType, criteriaValue)
  - `UserBadge` (id, userId, badgeId, earnedAt)
  - `ChatMessage` (id, userId, courseId, elementType, elementId, role, content, createdAt)
  - `CourseReviewLog` (id, courseId, roundNumber, studentFeedback, authorChanges, createdAt)
- [ ] Initial migration generated and applies cleanly
- [ ] Seed script creates: default badges, default admin user
- [ ] Database connection works in dev environment

**Status:** `open`

---

### Issue #3 — Implement authentication with NextAuth.js
**Labels:** `P0`, `phase-1`, `auth`
**Description:**
Full authentication system with registration, login, logout, JWT sessions, and role-based access.

**Acceptance Criteria:**
- [ ] NextAuth.js configured with credentials provider
- [ ] Registration endpoint: `POST /api/auth/register` (email, password, name)
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] JWT session with user id, email, role in token
- [ ] Login/Logout flow working
- [ ] Auth middleware protecting API routes
- [ ] Role-based middleware: `requireAdmin()`, `requireAuth()`
- [ ] Registration page UI (`/register`)
- [ ] Login page UI (`/login`)
- [ ] Redirect unauthenticated users to login

**Status:** `open`

---

### Issue #4 — Build application shell UI (layout, navigation, responsive)
**Labels:** `P0`, `phase-1`, `frontend`
**Description:**
Create the main app layout with responsive navigation, header, and core pages.

**Acceptance Criteria:**
- [ ] Root layout with sidebar navigation (desktop) and bottom tab bar (mobile)
- [ ] Header: logo, user avatar, XP counter, streak display
- [ ] Navigation items: Dashboard, Courses, Leaderboard, Profile
- [ ] Dashboard page (placeholder content)
- [ ] Courses page (placeholder content)
- [ ] Leaderboard page (placeholder content)
- [ ] Profile page (placeholder content)
- [ ] Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- [ ] Loading skeleton components
- [ ] Error boundary component
- [ ] Toast notification system (for badges, achievements, errors)

**Status:** `open`

---

## Phase 2: File Upload & Text Extraction

### Issue #5 — Build file upload UI with drag-and-drop
**Labels:** `P0`, `phase-2`, `frontend`
**Description:**
Create the operator's file upload interface for importing course source material.

**Acceptance Criteria:**
- [ ] Upload page accessible to admin users only (`/admin/upload`)
- [ ] Drag-and-drop zone with visual feedback
- [ ] File picker button as fallback
- [ ] File type validation: only .pdf, .txt, .md accepted
- [ ] File size validation: max 50MB, clear error message
- [ ] Upload progress bar
- [ ] Preview of extracted text after upload
- [ ] "Generate Course" button appears after successful upload
- [ ] Mobile-optimized: file picker works on mobile browsers

**Status:** `open`

---

### Issue #6 — Implement file processing backend (PDF/text extraction)
**Labels:** `P0`, `phase-2`, `backend`
**Description:**
API endpoint that receives uploaded files, extracts text content, and stores both.

**Acceptance Criteria:**
- [ ] API route: `POST /api/courses/upload` (multipart form data)
- [ ] PDF text extraction using `pdf-parse` library
- [ ] TXT/MD files: direct text reading
- [ ] Original file saved to `/uploads/{courseId}/{filename}`
- [ ] Extracted text stored in `Course.sourceText` field
- [ ] Course record created with status `draft`
- [ ] Returns: courseId, extracted text preview (first 500 chars), total character count
- [ ] Error handling: corrupt PDFs, empty files, unsupported formats
- [ ] File size limit enforced server-side

**Status:** `open`

---

## Phase 3: AI Course Generation Pipeline

### Issue #7 — Set up Anthropic SDK integration and AI service layer
**Labels:** `P0`, `phase-3`, `backend`, `ai`
**Description:**
Create a reusable AI service layer wrapping the Anthropic Claude SDK.

**Acceptance Criteria:**
- [ ] `@anthropic-ai/sdk` installed
- [ ] AI service class/module at `/lib/ai/anthropic.ts`
- [ ] Configurable API key via environment variable `ANTHROPIC_API_KEY`
- [ ] Helper for structured JSON output (parse AI response as JSON)
- [ ] Streaming support for long generations
- [ ] Retry logic with exponential backoff for transient errors
- [ ] Token usage logging
- [ ] Rate limit handling
- [ ] Error types: `AIServiceError`, `AIRateLimitError`, `AIParseError`

**Status:** `open`

---

### Issue #8 — Implement Author Agent: content analysis & course structuring
**Labels:** `P0`, `phase-3`, `backend`, `ai`, `critical`
**Description:**
The Author Agent analyzes source material and creates a structured course skeleton with deductive ordering.

**Acceptance Criteria:**
- [ ] System prompt crafted for expert instructional designer role
- [ ] Step 1: Extract all key concepts and topics from source text
- [ ] Step 2: Identify concept dependencies (prerequisite relationships)
- [ ] Step 3: Order topics deductively (general → specific, prerequisite → dependent)
- [ ] Step 4: Group into modules (logical topic clusters)
- [ ] Step 5: Split modules into bite-sized lessons (one concept per lesson, 2-3 min read)
- [ ] Output: Structured JSON with course title, description, learning objectives, modules with lesson titles
- [ ] Handles large source texts (chunking if needed for token limits)
- [ ] Prompt includes pedagogical guidelines: scaffolding, Bloom's taxonomy, engagement

**Status:** `open`

---

### Issue #9 — Implement Author Agent: lesson content & quiz generation
**Labels:** `P0`, `phase-3`, `backend`, `ai`, `critical`
**Description:**
Generate full lesson content and quiz questions for each module.

**Acceptance Criteria:**
- [ ] For each lesson, generate:
  - Engaging content with analogies, examples, real-world connections
  - Conversational but informative tone
  - Key takeaways (2-3 bullet points)
  - Content in markdown format
- [ ] For each module, generate quiz questions:
  - 3-5 questions per module
  - Types: multiple choice (4 options), true/false, fill-in-the-blank
  - Difficulty progression: easy → medium → hard
  - Each question has explanation for correct answer
  - Questions test understanding, not just memorization (Bloom's: Apply, Analyze)
- [ ] Content is engaging, uses analogies, avoids dry textbook style
- [ ] Output as structured JSON matching the database schema

**Status:** `open`

---

### Issue #10 — Implement Author Agent: SVG visualization generation
**Labels:** `P0`, `phase-3`, `backend`, `ai`
**Description:**
Generate an SVG concept diagram for every lesson.

**Acceptance Criteria:**
- [ ] For each lesson, generate an SVG that visualizes the core concept
- [ ] SVG style guide in prompt:
  - Clean, colorful, geometric shapes
  - Labeled elements
  - Max 500x300px viewBox
  - Use only: rect, circle, ellipse, line, polyline, polygon, path, text, g, defs, linearGradient
  - No external images, no scripts, no CSS imports
- [ ] SVG validation: well-formed XML
- [ ] SVG sanitization: strip any script tags, event handlers, external references
- [ ] Fallback: generate a simple colored icon/shape if full SVG fails
- [ ] SVGs should be informational, not decorative — actually represent the concept

**Status:** `open`

---

### Issue #11 — Implement Student Simulator Agent (3-round review)
**Labels:** `P0`, `phase-3`, `backend`, `ai`, `critical`
**Description:**
AI agent that simulates a student going through the course and provides structured feedback.

**Acceptance Criteria:**
- [ ] System prompt for beginner student persona
- [ ] Round 1 — Structural Review:
  - Knowledge gaps (lesson assumes untaught concepts)
  - Prerequisite ordering issues
  - Difficulty jumps
  - Missing foundational concepts
- [ ] Round 2 — Clarity & Engagement Review:
  - Confusing explanations
  - Dry/boring sections
  - Unhelpful analogies
  - Quiz questions that don't match taught content
  - Engagement rating per lesson
- [ ] Round 3 — Polish & Fun Review:
  - Language tone and fun factor
  - "Aha moment" opportunities
  - SVG accuracy check
  - Overall consistency
- [ ] Output per round: structured JSON feedback with specific lesson/question references
- [ ] Feedback includes severity (critical/important/suggestion)

**Status:** `open`

---

### Issue #12 — Implement Author-Student feedback loop orchestrator
**Labels:** `P0`, `phase-3`, `backend`, `ai`, `critical`
**Description:**
Orchestrate 3 cycles of Student review → Author revision.

**Acceptance Criteria:**
- [ ] Orchestrator function that runs the full pipeline:
  1. Author generates initial course
  2. Student reviews (Round 1) → Feedback
  3. Author revises based on feedback
  4. Student reviews (Round 2) → Feedback
  5. Author revises based on feedback
  6. Student reviews (Round 3) → Feedback
  7. Author makes final revisions
- [ ] Each round's feedback and changes stored in `CourseReviewLog`
- [ ] Status updates emitted at each stage (for progress UI)
- [ ] Full pipeline handles errors gracefully (retry individual steps)
- [ ] Final course saved to database (Modules, Lessons, QuizQuestions)
- [ ] Course status set to `in_review` after pipeline completes
- [ ] Total pipeline is resumable if interrupted

**Status:** `open`

---

### Issue #13 — Build course generation status/progress UI
**Labels:** `P0`, `phase-3`, `frontend`
**Description:**
Real-time progress page showing course generation pipeline status.

**Acceptance Criteria:**
- [ ] Progress page at `/admin/courses/{id}/generating`
- [ ] Status updates via polling (every 3s) or SSE:
  - "Analyzing source material..."
  - "Identifying key concepts..."
  - "Structuring course outline..."
  - "Generating lesson content..."
  - "Creating SVG visualizations..."
  - "AI Student Review — Round 1 of 3..."
  - "Applying Round 1 improvements..."
  - "AI Student Review — Round 2 of 3..."
  - "Applying Round 2 improvements..."
  - "AI Student Review — Round 3 of 3..."
  - "Applying final improvements..."
  - "Course ready for review!"
- [ ] Progress bar showing overall completion
- [ ] Expandable log showing details of each step
- [ ] Error state with "Retry" button
- [ ] Auto-redirect to edit mode when complete

**Status:** `open`

---

## Phase 4: Operator Edit Mode & AI Co-Author

### Issue #14 — Build operator course review/edit UI
**Labels:** `P0`, `phase-4`, `frontend`
**Description:**
Operator walks through the course card-by-card in edit mode.

**Acceptance Criteria:**
- [ ] Edit mode page at `/admin/courses/{id}/edit`
- [ ] Course overview sidebar: module list with lesson titles, expandable
- [ ] Card-by-card lesson view (same layout as learner view)
- [ ] Edit button on: lesson title, lesson content, SVG, key takeaways
- [ ] Inline editing with markdown support (content editable or textarea with preview)
- [ ] Quiz question editing: edit question text, options, correct answer, explanation
- [ ] Add new lesson / delete lesson buttons
- [ ] Add new quiz question / delete question buttons
- [ ] Drag-and-drop reordering of lessons within a module
- [ ] Drag-and-drop reordering of modules
- [ ] Save changes button (persists to database)
- [ ] "Preview as Learner" button (read-only view)

**Status:** `open`

---

### Issue #15 — Implement per-element AI chat panel
**Labels:** `P0`, `phase-4`, `frontend`, `ai`
**Description:**
Every course element has a chat icon that opens a panel for conversational AI editing.

**Acceptance Criteria:**
- [ ] Chat icon on every: lesson card, quiz question, answer option, SVG
- [ ] Clicking opens slide-out panel (right side desktop, bottom sheet mobile)
- [ ] Chat interface: message input, send button, message history
- [ ] Messages sent to Anthropic API via `/api/chat/element`
- [ ] API receives: elementType, elementId, message, and injects full context (current element content + course structure summary)
- [ ] AI responses streamed and rendered as markdown
- [ ] Chat history persisted in `ChatMessage` table
- [ ] Previous chat history loaded when reopening panel for same element
- [ ] Suggested quick actions: "Simplify", "Add example", "Make more fun", "Regenerate SVG"

**Status:** `open`

---

### Issue #16 — Implement accept/edit/reject suggestion workflow
**Labels:** `P0`, `phase-4`, `frontend`, `backend`
**Description:**
When AI suggests content changes in chat, operator can accept, edit, or reject.

**Acceptance Criteria:**
- [ ] AI responses that contain replacement content are formatted as suggestions
- [ ] "Accept" button: replaces the element's content with AI suggestion, saves to DB
- [ ] "Edit" button: opens suggestion in an editable field, operator modifies, then saves
- [ ] "Reject" button: dismisses suggestion, keeps original content
- [ ] For SVG suggestions: live preview of new SVG before accepting
- [ ] Change history: track what was changed and when (for undo capability)
- [ ] Undo last change button (reverts to previous version)

**Status:** `open`

---

### Issue #17 — Implement course publishing workflow
**Labels:** `P0`, `phase-4`, `backend`, `frontend`
**Description:**
Operator publishes a reviewed course, making it available to learners.

**Acceptance Criteria:**
- [ ] "Publish" button on course edit page
- [ ] Pre-publish validation:
  - Every module has at least 1 lesson
  - Every module has at least 1 quiz question
  - All lessons have content and SVG
  - All quiz questions have correct answers and explanations
- [ ] Validation errors shown with links to fix issues
- [ ] Status transition: `in_review` → `published`
- [ ] Published date recorded
- [ ] "Unpublish" button to revert to `in_review`
- [ ] Published courses appear in learner course browser
- [ ] Admin course list shows status badge (draft/in_review/published)

**Status:** `open`

---

## Phase 5: Learner Experience

### Issue #18 — Build course browser/catalog
**Labels:** `P1`, `phase-5`, `frontend`
**Description:**
Learners browse and enroll in published courses.

**Acceptance Criteria:**
- [ ] Courses page (`/courses`) shows grid of published course cards
- [ ] Course card: title, description (truncated), module count, lesson count, difficulty indicator
- [ ] If enrolled: show progress bar on card
- [ ] Search bar: search by title and description
- [ ] "Start Course" / "Continue" button on each card
- [ ] Course detail page (`/courses/{id}`) with:
  - Full description
  - Learning objectives
  - Module/lesson outline (expandable)
  - "Enroll" or "Continue" button
- [ ] Responsive grid: 1 column mobile, 2 tablet, 3 desktop

**Status:** `open`

---

### Issue #19 — Build lesson view (card-based learning experience)
**Labels:** `P1`, `phase-5`, `frontend`, `critical`
**Description:**
The core learning experience: card-based lessons with SVG visualizations.

**Acceptance Criteria:**
- [ ] Lesson page: `/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`
- [ ] Full-screen card layout:
  - SVG visualization at top (rendered inline, responsive)
  - Lesson title
  - Content body (rendered markdown with syntax highlighting for code)
  - Key takeaways at bottom
- [ ] Navigation: "Previous" and "Next" buttons
- [ ] Swipe left/right on mobile (touch gesture support)
- [ ] Progress bar at top showing position within module
- [ ] Lesson auto-marked as completed when navigating to next
- [ ] XP awarded on lesson completion (+10 XP)
- [ ] Smooth transitions between lessons
- [ ] "Back to course" breadcrumb

**Status:** `open`

---

### Issue #20 — Build quiz view with immediate feedback
**Labels:** `P1`, `phase-5`, `frontend`
**Description:**
Quiz interface at the end of each module with per-question feedback.

**Acceptance Criteria:**
- [ ] Quiz page: `/courses/{courseId}/modules/{moduleId}/quiz`
- [ ] One question per screen
- [ ] Multiple choice: tap option to select, "Check" button to submit
- [ ] True/False: two large buttons
- [ ] Fill-in-the-blank: text input with "Check" button
- [ ] Immediate feedback:
  - Correct: green highlight + "Correct!" + explanation
  - Wrong: red highlight + "Not quite" + show correct answer + explanation
- [ ] Navigation to next question after feedback
- [ ] Score summary screen at end: X/Y correct, percentage, XP earned
- [ ] XP awarded: +25 base + 5 per correct + 50 bonus for perfect score
- [ ] "Retry Quiz" button
- [ ] Must meet passing score to unlock next module (show if locked)
- [ ] Quiz attempt saved to `QuizAttempt` table

**Status:** `open`

---

### Issue #21 — Build progress tracking dashboard
**Labels:** `P1`, `phase-5`, `frontend`, `backend`
**Description:**
User dashboard showing learning progress across all courses.

**Acceptance Criteria:**
- [ ] Dashboard page (`/dashboard`) as the home page for logged-in users
- [ ] "Continue Learning" card: most recent in-progress course with resume button
- [ ] Per-course progress: completed lessons / total, best quiz scores
- [ ] Overall stats:
  - Total XP
  - Current level with progress bar to next level
  - Current streak
  - Total lessons completed
  - Total quizzes passed
  - Courses completed
- [ ] Visual progress rings/bars
- [ ] API endpoint: `GET /api/progress/stats`
- [ ] Responsive: stacks vertically on mobile

**Status:** `open`

---

## Phase 6: Gamification System

### Issue #22 — Implement XP and leveling system
**Labels:** `P1`, `phase-6`, `backend`, `frontend`
**Description:**
XP earning, level calculation, and level-up celebrations.

**Acceptance Criteria:**
- [ ] XP award function triggered by:
  - Lesson completion: +10 XP
  - Quiz completion: +25 XP + 5 per correct answer
  - Perfect quiz: +50 XP bonus
- [ ] Level formula: `Level = floor(sqrt(XP / 25)) + 1`
- [ ] XP gain animation on frontend (floating +XP number)
- [ ] Level-up detection and celebration UI (confetti effect, congratulations modal)
- [ ] XP and level displayed in header
- [ ] XP and level displayed on profile page
- [ ] API: `GET /api/user/stats` returns XP, level, nextLevelXP

**Status:** `open`

---

### Issue #23 — Implement streak system
**Labels:** `P1`, `phase-6`, `backend`, `frontend`
**Description:**
Daily study streak tracking and display.

**Acceptance Criteria:**
- [ ] Track daily study activity (any lesson completed or quiz taken)
- [ ] Streak increment: if last study was yesterday, increment streak
- [ ] Streak reset: if last study was 2+ days ago, reset to 1
- [ ] Streak continue: if last study was today, no change
- [ ] Streak displayed in header with fire icon
- [ ] Streak milestones: toast notification at 3, 7, 14, 30, 60, 100 days
- [ ] Profile page shows current streak and longest streak
- [ ] API endpoint updates streak on any study activity

**Status:** `open`

---

### Issue #24 — Implement badge/achievement system
**Labels:** `P1`, `phase-6`, `backend`, `frontend`
**Description:**
Achievement badges earned by meeting specific criteria.

**Acceptance Criteria:**
- [ ] Predefined badges (seeded in DB):
  - "First Steps" — Complete first lesson
  - "Quiz Taker" — Complete first quiz
  - "Quiz Master" — Score 100% on any quiz
  - "Streak Starter" — 3-day streak
  - "Streak Warrior" — 7-day streak
  - "Streak Legend" — 30-day streak
  - "Course Complete" — Finish an entire course
  - "Speed Learner" — Complete 10 lessons in one day
  - "Knowledge Seeker" — Enroll in 5 courses
  - "Scholar" — Complete 3 courses
  - "Centurion" — Earn 1000 XP
  - "Grandmaster" — Reach Level 10
- [ ] Badge check runs after each relevant action (lesson complete, quiz complete, etc.)
- [ ] Badge earned: toast notification with badge icon and name
- [ ] Profile page: badge showcase grid (earned badges colored, unearned greyed out)
- [ ] Badge detail: click to see description and earn date

**Status:** `open`

---

### Issue #25 — Build leaderboard
**Labels:** `P1`, `phase-6`, `frontend`, `backend`
**Description:**
Weekly and all-time XP leaderboard.

**Acceptance Criteria:**
- [ ] Leaderboard page (`/leaderboard`)
- [ ] Tabs: "This Week" and "All Time"
- [ ] Displays: rank, avatar, name, XP, level, streak
- [ ] Top 3 with special styling (gold #1, silver #2, bronze #3)
- [ ] Current user highlighted regardless of position
- [ ] If current user not in top N, show their rank at bottom
- [ ] Weekly leaderboard: XP earned since last Monday 00:00 UTC
- [ ] API: `GET /api/leaderboard?type=weekly|alltime&limit=50`
- [ ] Responsive: card list on mobile, table on desktop

**Status:** `open`

---

## Phase 7: Polish, Testing & Deployment

### Issue #26 — Mobile responsiveness & touch optimization
**Labels:** `P2`, `phase-7`, `frontend`
**Description:**
Ensure all views work perfectly on mobile devices.

**Acceptance Criteria:**
- [ ] Test all pages at 320px, 375px, 414px widths
- [ ] Touch targets minimum 44x44px
- [ ] Swipe gestures on lesson cards (left = next, right = previous)
- [ ] Bottom sheet for AI chat panel on mobile
- [ ] Collapsible sidebar on tablet
- [ ] PWA manifest for "Add to Home Screen"
- [ ] Viewport meta tag configured correctly
- [ ] No horizontal scroll on any page
- [ ] Font sizes readable without zoom on mobile

**Status:** `open`

---

### Issue #27 — Error handling & edge cases
**Labels:** `P2`, `phase-7`, `backend`, `frontend`
**Description:**
Robust error handling throughout the application.

**Acceptance Criteria:**
- [ ] API error responses: consistent JSON format `{error, message, code}`
- [ ] Anthropic API: handle rate limits (429), timeouts, malformed responses
- [ ] Empty states: "No courses yet", "No progress yet", "No badges yet"
- [ ] Loading skeletons on all data-fetching pages
- [ ] File upload: handle corrupt PDFs, password-protected PDFs, empty files
- [ ] Course generation: handle partial failures, allow retry of failed steps
- [ ] Quiz: handle edge case of 0 questions
- [ ] Auth: handle expired tokens, redirect to login
- [ ] Global error boundary with "Something went wrong" page

**Status:** `open`

---

### Issue #28 — Write tests (unit, integration, E2E)
**Labels:** `P2`, `phase-7`, `testing`
**Description:**
Test coverage for critical paths.

**Acceptance Criteria:**
- [ ] Unit tests:
  - AI service helper functions (JSON parsing, SVG validation)
  - XP calculation and level formula
  - Streak logic (increment, reset, continue)
  - Badge criteria checking
- [ ] Integration tests:
  - Auth API (register, login, protected routes)
  - Course CRUD API
  - Progress tracking API
  - Quiz submission API
- [ ] E2E test (Playwright or Cypress):
  - Full flow: register → login → admin uploads file → course generated → operator edits → publishes → learner enrolls → completes lesson → takes quiz → earns XP/badge
- [ ] Test config: Jest for unit/integration, Playwright for E2E

**Status:** `open`

---

### Issue #29 — Deployment configuration (Docker, env, migrations)
**Labels:** `P2`, `phase-7`, `devops`
**Description:**
Make the application deployable.

**Acceptance Criteria:**
- [ ] `Dockerfile` for production build (multi-stage: build + runtime)
- [ ] `docker-compose.yml` with app + PostgreSQL
- [ ] `.env.example` with all required environment variables documented
- [ ] Database migration runs on startup
- [ ] Seed script for initial data (badges, admin user)
- [ ] Health check endpoint: `GET /api/health`
- [ ] Production Next.js build optimized (output: standalone)
- [ ] README with setup and deployment instructions

**Status:** `open`

---

## Summary

| Phase | Issues | Priority |
|-------|--------|----------|
| Phase 1: Foundation | #1 - #4 | P0 |
| Phase 2: File Upload | #5 - #6 | P0 |
| Phase 3: AI Pipeline | #7 - #13 | P0 (Critical) |
| Phase 4: Operator Edit | #14 - #17 | P0 |
| Phase 5: Learner UX | #18 - #21 | P1 |
| Phase 6: Gamification | #22 - #25 | P1 |
| Phase 7: Polish | #26 - #29 | P2 |
| **Total** | **29 issues** | |

## Execution Order (Critical Path)

```
#1 → #2 → #3 → #4 → #5 → #6 → #7 → #8 → #9 → #10 → #11 → #12 → #13
                                                                    ↓
                                                        #14 → #15 → #16 → #17
                                                                    ↓
                                                        #18 → #19 → #20 → #21
                                                                    ↓
                                                        #22 → #23 → #24 → #25
                                                                    ↓
                                                        #26 → #27 → #28 → #29
```
