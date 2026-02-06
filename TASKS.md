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
- [x] Next.js 14 project created with App Router enabled
- [x] TypeScript configured with strict mode
- [x] Tailwind CSS installed and configured
- [x] shadcn/ui installed with base components (Button, Card, Input, Dialog, Sheet, etc.)
- [x] Project structure: `/app`, `/components`, `/lib`, `/prisma`, `/types`
- [x] ESLint and Prettier configured
- [x] Path aliases (`@/`) configured in tsconfig
- [x] `npm run dev` starts without errors

**Status:** `done`

---

### Issue #2 — Set up PostgreSQL + Prisma ORM with full schema
**Labels:** `P0`, `phase-1`, `database`
**Description:**
Define the complete database schema in Prisma and set up PostgreSQL connection.

**Acceptance Criteria:**
- [x] Prisma installed and configured
- [x] Complete schema with all models:
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
- [x] Initial migration generated and applies cleanly
- [x] Seed script creates: default badges, default admin user
- [x] Database connection works in dev environment

**Status:** `done`

---

### Issue #3 — Implement authentication with NextAuth.js
**Labels:** `P0`, `phase-1`, `auth`
**Description:**
Full authentication system with registration, login, logout, JWT sessions, and role-based access.

**Acceptance Criteria:**
- [x] NextAuth.js configured with credentials provider
- [x] Registration endpoint: `POST /api/auth/register` (email, password, name)
- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT session with user id, email, role in token
- [x] Login/Logout flow working
- [x] Auth middleware protecting API routes
- [x] Role-based middleware: `requireAdmin()`, `requireAuth()`
- [x] Registration page UI (`/register`)
- [x] Login page UI (`/login`)
- [x] Redirect unauthenticated users to login

**Status:** `done`

---

### Issue #4 — Build application shell UI (layout, navigation, responsive)
**Labels:** `P0`, `phase-1`, `frontend`
**Description:**
Create the main app layout with responsive navigation, header, and core pages.

**Acceptance Criteria:**
- [x] Root layout with sidebar navigation (desktop) and bottom tab bar (mobile)
- [x] Header: logo, user avatar, XP counter, streak display
- [x] Navigation items: Dashboard, Courses, Leaderboard, Profile
- [x] Dashboard page (placeholder content)
- [x] Courses page (placeholder content)
- [x] Leaderboard page (placeholder content)
- [x] Profile page (placeholder content)
- [x] Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- [x] Loading skeleton components
- [x] Error boundary component
- [x] Toast notification system (for badges, achievements, errors)

**Status:** `done`

---

## Phase 2: File Upload & Text Extraction

### Issue #5 — Build file upload UI with drag-and-drop
**Labels:** `P0`, `phase-2`, `frontend`
**Description:**
Create the operator's file upload interface for importing course source material.

**Acceptance Criteria:**
- [x] Upload page accessible to admin users only (`/admin/upload`)
- [x] Drag-and-drop zone with visual feedback
- [x] File picker button as fallback
- [x] File type validation: only .pdf, .txt, .md accepted
- [x] File size validation: max 50MB, clear error message
- [x] Upload progress bar
- [x] Preview of extracted text after upload
- [x] "Generate Course" button appears after successful upload
- [x] Mobile-optimized: file picker works on mobile browsers

**Status:** `done`

---

### Issue #6 — Implement file processing backend (PDF/text extraction)
**Labels:** `P0`, `phase-2`, `backend`
**Description:**
API endpoint that receives uploaded files, extracts text content, and stores both.

**Acceptance Criteria:**
- [x] API route: `POST /api/courses/upload` (multipart form data)
- [x] PDF text extraction using `pdf-parse` library
- [x] TXT/MD files: direct text reading
- [x] Original file saved to `/uploads/{courseId}/{filename}`
- [x] Extracted text stored in `Course.sourceText` field
- [x] Course record created with status `draft`
- [x] Returns: courseId, extracted text preview (first 500 chars), total character count
- [x] Error handling: corrupt PDFs, empty files, unsupported formats
- [x] File size limit enforced server-side

**Status:** `done`

---

## Phase 3: AI Course Generation Pipeline

### Issue #7 — Set up Anthropic SDK integration and AI service layer
**Labels:** `P0`, `phase-3`, `backend`, `ai`
**Description:**
Create a reusable AI service layer wrapping the Anthropic Claude SDK.

**Acceptance Criteria:**
- [x] `@anthropic-ai/sdk` installed
- [x] AI service class/module at `/lib/ai/anthropic.ts`
- [x] Configurable API key via environment variable `ANTHROPIC_API_KEY`
- [x] Helper for structured JSON output (parse AI response as JSON)
- [x] Streaming support for long generations
- [x] Retry logic with exponential backoff for transient errors
- [x] Token usage logging
- [x] Rate limit handling
- [x] Error types: `AIServiceError`, `AIRateLimitError`, `AIParseError`

**Status:** `done`

---

### Issue #8 — Implement Author Agent: content analysis & course structuring
**Labels:** `P0`, `phase-3`, `backend`, `ai`, `critical`
**Description:**
The Author Agent analyzes source material and creates a structured course skeleton with deductive ordering.

**Acceptance Criteria:**
- [x] System prompt crafted for expert instructional designer role
- [x] Step 1: Extract all key concepts and topics from source text
- [x] Step 2: Identify concept dependencies (prerequisite relationships)
- [x] Step 3: Order topics deductively (general → specific, prerequisite → dependent)
- [x] Step 4: Group into modules (logical topic clusters)
- [x] Step 5: Split modules into bite-sized lessons (one concept per lesson, 2-3 min read)
- [x] Output: Structured JSON with course title, description, learning objectives, modules with lesson titles
- [x] Handles large source texts (chunking if needed for token limits)
- [x] Prompt includes pedagogical guidelines: scaffolding, Bloom's taxonomy, engagement

**Status:** `done`

---

### Issue #9 — Implement Author Agent: lesson content & quiz generation
**Labels:** `P0`, `phase-3`, `backend`, `ai`, `critical`
**Description:**
Generate full lesson content and quiz questions for each module.

**Acceptance Criteria:**
- [x] For each lesson, generate:
  - Engaging content with analogies, examples, real-world connections
  - Conversational but informative tone
  - Key takeaways (2-3 bullet points)
  - Content in markdown format
- [x] For each module, generate quiz questions:
  - 3-5 questions per module
  - Types: multiple choice (4 options), true/false, fill-in-the-blank
  - Difficulty progression: easy → medium → hard
  - Each question has explanation for correct answer
  - Questions test understanding, not just memorization (Bloom's: Apply, Analyze)
- [x] Content is engaging, uses analogies, avoids dry textbook style
- [x] Output as structured JSON matching the database schema

**Status:** `done`

---

### Issue #10 — Implement Author Agent: SVG visualization generation
**Labels:** `P0`, `phase-3`, `backend`, `ai`
**Description:**
Generate an SVG concept diagram for every lesson.

**Acceptance Criteria:**
- [x] For each lesson, generate an SVG that visualizes the core concept
- [x] SVG style guide in prompt:
  - Clean, colorful, geometric shapes
  - Labeled elements
  - Max 500x300px viewBox
  - Use only: rect, circle, ellipse, line, polyline, polygon, path, text, g, defs, linearGradient
  - No external images, no scripts, no CSS imports
- [x] SVG validation: well-formed XML
- [x] SVG sanitization: strip any script tags, event handlers, external references
- [x] Fallback: generate a simple colored icon/shape if full SVG fails
- [x] SVGs should be informational, not decorative — actually represent the concept

**Status:** `done`

---

### Issue #11 — Implement Student Simulator Agent (3-round review)
**Labels:** `P0`, `phase-3`, `backend`, `ai`, `critical`
**Description:**
AI agent that simulates a student going through the course and provides structured feedback.

**Acceptance Criteria:**
- [x] System prompt for beginner student persona
- [x] Round 1 — Structural Review:
  - Knowledge gaps (lesson assumes untaught concepts)
  - Prerequisite ordering issues
  - Difficulty jumps
  - Missing foundational concepts
- [x] Round 2 — Clarity & Engagement Review:
  - Confusing explanations
  - Dry/boring sections
  - Unhelpful analogies
  - Quiz questions that don't match taught content
  - Engagement rating per lesson
- [x] Round 3 — Polish & Fun Review:
  - Language tone and fun factor
  - "Aha moment" opportunities
  - SVG accuracy check
  - Overall consistency
- [x] Output per round: structured JSON feedback with specific lesson/question references
- [x] Feedback includes severity (critical/important/suggestion)

**Status:** `done`

---

### Issue #12 — Implement Author-Student feedback loop orchestrator
**Labels:** `P0`, `phase-3`, `backend`, `ai`, `critical`
**Description:**
Orchestrate 3 cycles of Student review → Author revision.

**Acceptance Criteria:**
- [x] Orchestrator function that runs the full pipeline:
  1. Author generates initial course
  2. Student reviews (Round 1) → Feedback
  3. Author revises based on feedback
  4. Student reviews (Round 2) → Feedback
  5. Author revises based on feedback
  6. Student reviews (Round 3) → Feedback
  7. Author makes final revisions
- [x] Each round's feedback and changes stored in `CourseReviewLog`
- [x] Status updates emitted at each stage (for progress UI)
- [x] Full pipeline handles errors gracefully (retry individual steps)
- [x] Final course saved to database (Modules, Lessons, QuizQuestions)
- [x] Course status set to `in_review` after pipeline completes
- [x] Total pipeline is resumable if interrupted

**Status:** `done`

---

### Issue #13 — Build course generation status/progress UI
**Labels:** `P0`, `phase-3`, `frontend`
**Description:**
Real-time progress page showing course generation pipeline status.

**Acceptance Criteria:**
- [x] Progress page at `/admin/courses/{id}/generating`
- [x] Status updates via polling (every 3s) or SSE:
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
- [x] Progress bar showing overall completion
- [x] Expandable log showing details of each step
- [x] Error state with "Retry" button
- [x] Auto-redirect to edit mode when complete

**Status:** `done`

---

## Phase 4: Operator Edit Mode & AI Co-Author

### Issue #14 — Build operator course review/edit UI
**Labels:** `P0`, `phase-4`, `frontend`
**Description:**
Operator walks through the course card-by-card in edit mode.

**Acceptance Criteria:**
- [x] Edit mode page at `/admin/courses/{id}/edit`
- [x] Course overview sidebar: module list with lesson titles, expandable
- [x] Card-by-card lesson view (same layout as learner view)
- [x] Edit button on: lesson title, lesson content, SVG, key takeaways
- [x] Inline editing with markdown support (content editable or textarea with preview)
- [x] Quiz question editing: edit question text, options, correct answer, explanation
- [x] Add new lesson / delete lesson buttons
- [x] Add new quiz question / delete question buttons
- [x] Drag-and-drop reordering of lessons within a module
- [x] Drag-and-drop reordering of modules
- [x] Save changes button (persists to database)
- [x] "Preview as Learner" button (read-only view)

**Status:** `done`

---

### Issue #15 — Implement per-element AI chat panel
**Labels:** `P0`, `phase-4`, `frontend`, `ai`
**Description:**
Every course element has a chat icon that opens a panel for conversational AI editing.

**Acceptance Criteria:**
- [x] Chat icon on every: lesson card, quiz question, answer option, SVG
- [x] Clicking opens slide-out panel (right side desktop, bottom sheet mobile)
- [x] Chat interface: message input, send button, message history
- [x] Messages sent to Anthropic API via `/api/chat/element`
- [x] API receives: elementType, elementId, message, and injects full context (current element content + course structure summary)
- [x] AI responses streamed and rendered as markdown
- [x] Chat history persisted in `ChatMessage` table
- [x] Previous chat history loaded when reopening panel for same element
- [x] Suggested quick actions: "Simplify", "Add example", "Make more fun", "Regenerate SVG"

**Status:** `done`

---

### Issue #16 — Implement accept/edit/reject suggestion workflow
**Labels:** `P0`, `phase-4`, `frontend`, `backend`
**Description:**
When AI suggests content changes in chat, operator can accept, edit, or reject.

**Acceptance Criteria:**
- [x] AI responses that contain replacement content are formatted as suggestions
- [x] "Accept" button: replaces the element's content with AI suggestion, saves to DB
- [x] "Edit" button: opens suggestion in an editable field, operator modifies, then saves
- [x] "Reject" button: dismisses suggestion, keeps original content
- [x] For SVG suggestions: live preview of new SVG before accepting
- [x] Change history: track what was changed and when (for undo capability)
- [x] Undo last change button (reverts to previous version)

**Status:** `done`

---

### Issue #17 — Implement course publishing workflow
**Labels:** `P0`, `phase-4`, `backend`, `frontend`
**Description:**
Operator publishes a reviewed course, making it available to learners.

**Acceptance Criteria:**
- [x] "Publish" button on course edit page
- [x] Pre-publish validation:
  - Every module has at least 1 lesson
  - Every module has at least 1 quiz question
  - All lessons have content and SVG
  - All quiz questions have correct answers and explanations
- [x] Validation errors shown with links to fix issues
- [x] Status transition: `in_review` → `published`
- [x] Published date recorded
- [x] "Unpublish" button to revert to `in_review`
- [x] Published courses appear in learner course browser
- [x] Admin course list shows status badge (draft/in_review/published)

**Status:** `done`

---

## Phase 5: Learner Experience

### Issue #18 — Build course browser/catalog
**Labels:** `P1`, `phase-5`, `frontend`
**Description:**
Learners browse and enroll in published courses.

**Acceptance Criteria:**
- [x] Courses page (`/courses`) shows grid of published course cards
- [x] Course card: title, description (truncated), module count, lesson count, difficulty indicator
- [x] If enrolled: show progress bar on card
- [x] Search bar: search by title and description
- [x] "Start Course" / "Continue" button on each card
- [x] Course detail page (`/courses/{id}`) with:
  - Full description
  - Learning objectives
  - Module/lesson outline (expandable)
  - "Enroll" or "Continue" button
- [x] Responsive grid: 1 column mobile, 2 tablet, 3 desktop

**Status:** `done`

---

### Issue #19 — Build lesson view (card-based learning experience)
**Labels:** `P1`, `phase-5`, `frontend`, `critical`
**Description:**
The core learning experience: card-based lessons with SVG visualizations.

**Acceptance Criteria:**
- [x] Lesson page: `/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`
- [x] Full-screen card layout:
  - SVG visualization at top (rendered inline, responsive)
  - Lesson title
  - Content body (rendered markdown with syntax highlighting for code)
  - Key takeaways at bottom
- [x] Navigation: "Previous" and "Next" buttons
- [x] Swipe left/right on mobile (touch gesture support)
- [x] Progress bar at top showing position within module
- [x] Lesson auto-marked as completed when navigating to next
- [x] XP awarded on lesson completion (+10 XP)
- [x] Smooth transitions between lessons
- [x] "Back to course" breadcrumb

**Status:** `done`

---

### Issue #20 — Build quiz view with immediate feedback
**Labels:** `P1`, `phase-5`, `frontend`
**Description:**
Quiz interface at the end of each module with per-question feedback.

**Acceptance Criteria:**
- [x] Quiz page: `/courses/{courseId}/modules/{moduleId}/quiz`
- [x] One question per screen
- [x] Multiple choice: tap option to select, "Check" button to submit
- [x] True/False: two large buttons
- [x] Fill-in-the-blank: text input with "Check" button
- [x] Immediate feedback:
  - Correct: green highlight + "Correct!" + explanation
  - Wrong: red highlight + "Not quite" + show correct answer + explanation
- [x] Navigation to next question after feedback
- [x] Score summary screen at end: X/Y correct, percentage, XP earned
- [x] XP awarded: +25 base + 5 per correct + 50 bonus for perfect score
- [x] "Retry Quiz" button
- [x] Must meet passing score to unlock next module (show if locked)
- [x] Quiz attempt saved to `QuizAttempt` table

**Status:** `done`

---

### Issue #21 — Build progress tracking dashboard
**Labels:** `P1`, `phase-5`, `frontend`, `backend`
**Description:**
User dashboard showing learning progress across all courses.

**Acceptance Criteria:**
- [x] Dashboard page (`/dashboard`) as the home page for logged-in users
- [x] "Continue Learning" card: most recent in-progress course with resume button
- [x] Per-course progress: completed lessons / total, best quiz scores
- [x] Overall stats:
  - Total XP
  - Current level with progress bar to next level
  - Current streak
  - Total lessons completed
  - Total quizzes passed
  - Courses completed
- [x] Visual progress rings/bars
- [x] API endpoint: `GET /api/progress/stats`
- [x] Responsive: stacks vertically on mobile

**Status:** `done`

---

## Phase 6: Gamification System

### Issue #22 — Implement XP and leveling system
**Labels:** `P1`, `phase-6`, `backend`, `frontend`
**Description:**
XP earning, level calculation, and level-up celebrations.

**Acceptance Criteria:**
- [x] XP award function triggered by:
  - Lesson completion: +10 XP
  - Quiz completion: +25 XP + 5 per correct answer
  - Perfect quiz: +50 XP bonus
- [x] Level formula: `Level = floor(sqrt(XP / 25)) + 1`
- [x] XP gain animation on frontend (floating +XP number)
- [x] Level-up detection and celebration UI (confetti effect, congratulations modal)
- [x] XP and level displayed in header
- [x] XP and level displayed on profile page
- [x] API: `GET /api/user/stats` returns XP, level, nextLevelXP

**Status:** `done`

---

### Issue #23 — Implement streak system
**Labels:** `P1`, `phase-6`, `backend`, `frontend`
**Description:**
Daily study streak tracking and display.

**Acceptance Criteria:**
- [x] Track daily study activity (any lesson completed or quiz taken)
- [x] Streak increment: if last study was yesterday, increment streak
- [x] Streak reset: if last study was 2+ days ago, reset to 1
- [x] Streak continue: if last study was today, no change
- [x] Streak displayed in header with fire icon
- [x] Streak milestones: toast notification at 3, 7, 14, 30, 60, 100 days
- [x] Profile page shows current streak and longest streak
- [x] API endpoint updates streak on any study activity

**Status:** `done`

---

### Issue #24 — Implement badge/achievement system
**Labels:** `P1`, `phase-6`, `backend`, `frontend`
**Description:**
Achievement badges earned by meeting specific criteria.

**Acceptance Criteria:**
- [x] Predefined badges (seeded in DB):
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
- [x] Badge check runs after each relevant action (lesson complete, quiz complete, etc.)
- [x] Badge earned: toast notification with badge icon and name
- [x] Profile page: badge showcase grid (earned badges colored, unearned greyed out)
- [x] Badge detail: click to see description and earn date

**Status:** `done`

---

### Issue #25 — Build leaderboard
**Labels:** `P1`, `phase-6`, `frontend`, `backend`
**Description:**
Weekly and all-time XP leaderboard.

**Acceptance Criteria:**
- [x] Leaderboard page (`/leaderboard`)
- [x] Tabs: "This Week" and "All Time"
- [x] Displays: rank, avatar, name, XP, level, streak
- [x] Top 3 with special styling (gold #1, silver #2, bronze #3)
- [x] Current user highlighted regardless of position
- [x] If current user not in top N, show their rank at bottom
- [x] Weekly leaderboard: XP earned since last Monday 00:00 UTC
- [x] API: `GET /api/leaderboard?type=weekly|alltime&limit=50`
- [x] Responsive: card list on mobile, table on desktop

**Status:** `done`

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
