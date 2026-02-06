# Know - Implementation Plan

## Overview

This plan breaks down the implementation into **7 phases**, ordered by dependency. Each phase produces a working increment. Total: ~35 tasks organized as GitHub issues.

---

## Phase 1: Project Foundation & Infrastructure

**Goal:** Bootable Next.js app with database, auth, and base UI shell.

### 1.1 Initialize Next.js project with TypeScript, Tailwind CSS, shadcn/ui
- `npx create-next-app@latest` with App Router
- Install and configure Tailwind CSS
- Install and configure shadcn/ui component library
- Set up project structure: `/app`, `/components`, `/lib`, `/prisma`
- Configure path aliases, ESLint, Prettier

### 1.2 Set up PostgreSQL + Prisma ORM
- Create Prisma schema with all models (Users, Courses, Modules, Lessons, QuizQuestions, UserProgress, QuizAttempts, Badges, UserBadges, ChatMessages, CourseReviewLogs)
- Configure database connection
- Generate initial migration
- Create seed script for default badges and admin user

### 1.3 Implement Authentication (NextAuth.js)
- Install and configure NextAuth.js with credentials provider
- Create registration API endpoint with bcrypt password hashing
- Create login/logout flow
- Implement JWT session management
- Create auth middleware for protected routes
- Role-based access control (admin vs learner)

### 1.4 Build Application Shell UI
- Responsive layout: sidebar (desktop) / bottom nav (mobile)
- Top header with user avatar, XP display, streak counter
- Navigation: Dashboard, Courses, Leaderboard, Profile
- Dark/light theme support (optional but nice)
- Loading states and error boundaries

**Deliverable:** Running app with login, registration, and empty dashboard.

---

## Phase 2: File Upload & Text Extraction

**Goal:** Operator can upload PDF/text files and raw text is extracted and stored.

### 2.1 Build File Upload UI
- Drag-and-drop zone + file picker button
- File type validation (PDF, TXT, MD)
- Upload progress indicator
- File size validation (50MB max)

### 2.2 Implement File Processing Backend
- API route for file upload (multipart form)
- PDF text extraction using `pdf-parse`
- TXT/MD direct text reading
- Store original file on filesystem
- Store extracted text in database
- Return extracted text preview to operator

**Deliverable:** Operator can upload a PDF and see extracted text.

---

## Phase 3: AI Course Generation Pipeline (CRITICAL PATH)

**Goal:** The core AI pipeline that transforms raw text into a structured course.

### 3.1 Set up Anthropic SDK integration
- Install `@anthropic-ai/sdk`
- Create AI service layer with configurable API key
- Implement streaming support for long generations
- Error handling and retry logic
- Token usage tracking

### 3.2 Implement Author Agent — Content Analysis & Structuring
- System prompt for instructional design expert
- Step 1: Analyze source material, extract key concepts
- Step 2: Build concept dependency graph
- Step 3: Order topics deductively
- Step 4: Split into modules and bite-sized lessons
- Output: Structured JSON course skeleton

### 3.3 Implement Author Agent — Lesson Content Generation
- For each lesson: generate engaging content with analogies and examples
- Generate key takeaways per lesson
- Generate quiz questions per module (multiple types, varying difficulty)
- Output: Full course JSON with all content

### 3.4 Implement Author Agent — SVG Visualization Generation
- For each lesson: generate an SVG diagram representing the core concept
- SVG style guide in prompt: clean, colorful, geometric, labeled
- Validate SVG output (well-formed XML)
- Sanitize SVG for security (no scripts, external references)
- Fallback: simple colored icon if SVG generation fails

### 3.5 Implement Student Simulator Agent
- System prompt for beginner student persona
- Input: Full generated course
- Round 1: Structural review (gaps, prerequisites, flow)
- Round 2: Clarity & engagement review
- Round 3: Polish & fun review
- Output per round: Structured feedback JSON

### 3.6 Implement Author-Student Feedback Loop
- Orchestrator that runs 3 review cycles:
  1. Student reviews → Feedback
  2. Author revises based on feedback → Updated course
  3. Repeat 3 times
- Store review logs for operator transparency
- Progress tracking/status updates during generation

### 3.7 Build Course Generation Status UI
- "Generating course..." progress page
- Real-time status updates (SSE or polling):
  - "Analyzing source material..."
  - "Structuring into modules..."
  - "Generating lessons..."
  - "Creating visualizations..."
  - "AI Student Review — Round 1/3..."
  - "AI Student Review — Round 2/3..."
  - "AI Student Review — Round 3/3..."
  - "Course ready for review!"
- Error state with retry option

**Deliverable:** Upload a file → AI generates a full course with 3 review cycles → Course stored in DB.

---

## Phase 4: Operator Edit Mode & AI Co-Author Chat

**Goal:** Operator can walk through the generated course, edit elements, and chat with AI for refinements.

### 4.1 Build Operator Course Review UI
- Card-by-card lesson view (same layout as learner, but with edit controls)
- Edit button on every element (lesson title, content, SVG, quiz question, answer)
- Inline text editing with markdown support
- Module/lesson reordering via drag-and-drop
- Add/remove lessons and quiz questions manually
- Course overview sidebar showing structure

### 4.2 Implement Per-Element AI Chat Panel
- Slide-out chat panel (right side on desktop, bottom sheet on mobile)
- Chat connected to Anthropic API with full course context
- Context includes: current element, surrounding lessons, course structure
- Chat history persisted per element
- Streaming AI responses
- Markdown rendering in chat

### 4.3 Implement Accept/Edit/Reject Workflow
- AI suggestions displayed as editable diffs
- "Accept" button — replaces current content with suggestion
- "Edit" button — opens suggestion in editor for tweaking
- "Reject" button — dismisses suggestion
- SVG regeneration: operator can request new visualization via chat
- All changes tracked in revision history

### 4.4 Implement Course Publishing
- "Publish" button on course review page
- Validation: all modules have lessons, all quizzes have questions
- Status transition: draft → published
- Unpublish option
- Published courses appear in learner course browser

**Deliverable:** Operator can review, refine with AI assistance, and publish courses.

---

## Phase 5: Learner Experience

**Goal:** Learners can browse, enroll, learn, and take quizzes.

### 5.1 Build Course Browser
- Grid of published course cards
- Card shows: title, description, module count, estimated time, difficulty
- Search by title/description
- Filter by category (if applicable)
- Enrollment button → starts the course

### 5.2 Build Lesson View (Card-Based)
- Full-screen lesson card layout
- SVG visualization header (rendered inline)
- Lesson content (rendered markdown)
- Key takeaways section
- Next/Previous navigation buttons
- Swipe gesture support on mobile (touch events)
- Progress bar at top showing position in module
- Auto-mark lesson as completed on navigation

### 5.3 Build Quiz View
- One question per screen
- Multiple choice: tap to select, submit to check
- True/False: two large buttons
- Fill-in-the-blank: text input
- Immediate feedback: correct (green) / wrong (red) + explanation
- Score summary screen at end
- Retry option
- Must pass quiz to unlock next module (configurable passing score)

### 5.4 Build Progress Tracking
- Per-course: completed lessons / total, completed quizzes, best scores
- Overall dashboard: courses in progress, completed courses, total XP
- Visual progress bars and completion rings
- "Continue Learning" shortcut on dashboard (resumes last position)

**Deliverable:** Full learner flow from browsing to completing courses.

---

## Phase 6: Gamification System

**Goal:** XP, levels, streaks, badges, and leaderboard to drive engagement.

### 6.1 Implement XP & Leveling System
- XP awards:
  - Complete a lesson: +10 XP
  - Complete a quiz: +25 XP base + 5 per correct answer
  - Perfect quiz score: +50 XP bonus
- Level thresholds: Level = floor(sqrt(XP / 25)) + 1
- XP gain animation on frontend
- Level-up celebration UI (confetti, modal)

### 6.2 Implement Streak System
- Track daily study activity
- Increment streak on daily study
- Reset streak if a day is missed
- Streak freeze: one free freeze per week (optional)
- Streak display in header and profile
- Streak milestone celebrations (7-day, 30-day, etc.)

### 6.3 Implement Badge/Achievement System
- Predefined badges:
  - "First Steps" — Complete first lesson
  - "Quiz Master" — Score 100% on any quiz
  - "Streak Warrior" — 7-day streak
  - "Course Complete" — Finish an entire course
  - "Speed Learner" — Complete 10 lessons in one day
  - "Knowledge Seeker" — Enroll in 5 courses
  - (10+ more badges)
- Badge check runs after each relevant action
- Badge earned notification/toast
- Badge showcase on profile

### 6.4 Build Leaderboard
- Weekly leaderboard (resets every Monday)
- All-time leaderboard
- Displays: rank, avatar, name, XP, level, streak
- Current user highlighted
- Top 3 with special styling (gold/silver/bronze)

**Deliverable:** Full gamification loop motivating daily engagement.

---

## Phase 7: Polish, Testing & Deployment

**Goal:** Production-ready application.

### 7.1 Mobile Responsiveness & Touch Optimization
- Test and fix all views on 320px, 375px, 414px widths
- Touch targets minimum 44px
- Swipe gestures on lesson cards
- Bottom sheet for mobile chat panel
- PWA manifest for "Add to Home Screen"

### 7.2 Error Handling & Edge Cases
- API error handling (Anthropic rate limits, timeouts)
- Empty states (no courses, no progress)
- Loading skeletons
- Offline handling (save progress, sync when online)
- Large file upload handling

### 7.3 Testing
- Unit tests for AI pipeline utilities
- Integration tests for API routes
- Component tests for key UI flows
- E2E test for: upload → generate → review → publish → learn → quiz

### 7.4 Deployment Configuration
- Dockerfile for containerized deployment
- Environment variable configuration
- Database migration scripts
- Production build optimization
- Health check endpoint

**Deliverable:** Deployable, tested, production-ready application.

---

## Dependency Graph

```
Phase 1 (Foundation)
  ├── Phase 2 (File Upload) ──── Phase 3 (AI Pipeline) ──── Phase 4 (Operator Edit)
  │                                                              │
  │                                                              ├── Phase 5 (Learner)
  │                                                              │      │
  │                                                              │      ├── Phase 6 (Gamification)
  │                                                              │      │
  └──────────────────────────────────────────────────────────────────── Phase 7 (Polish)
```

## Task Count Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Foundation | 4 | P0 |
| Phase 2: File Upload | 2 | P0 |
| Phase 3: AI Pipeline | 7 | P0 (Critical) |
| Phase 4: Operator Edit | 4 | P0 |
| Phase 5: Learner UX | 4 | P1 |
| Phase 6: Gamification | 4 | P1 |
| Phase 7: Polish | 4 | P2 |
| **Total** | **29** | |
