# Know - AI-Powered Learning Platform

## Specification Document v1.0

---

## 1. Overview

**Know** is a responsive web application that transforms raw educational material (PDF/text files) into interactive, gamified learning courses. It uses AI (Anthropic Claude API) to intelligently decompose content into bite-sized lessons with auto-generated quizzes, SVG concept visualizations, and a multi-pass AI quality assurance pipeline. An operator/admin can collaboratively refine courses with AI assistance before publishing to learners.

---

## 2. Core Principles

- **Deductive Learning**: Every course flows from broad concepts to specific details. Each lesson logically builds on the previous one.
- **Bite-Sized**: Each lesson teaches exactly ONE concept, consumable in 2-3 minutes.
- **Fun & Engaging**: Analogies, real-world examples, storytelling, and visual diagrams keep learners engaged.
- **Pedagogically Sound**: Scaffolding, spaced repetition, prerequisite mapping, and Bloom's taxonomy-aligned questions.
- **Mobile-First**: Designed for touch, swipe, and small screens — but fully functional on desktop.

---

## 3. User Roles

### 3.1 Admin / Operator
- Upload PDF/text source material
- Trigger course generation
- Review AI-generated courses in **Edit Mode**
- Chat with AI on any course element to refine content
- Accept/reject AI suggestions
- Publish courses for learners
- View analytics and user progress

### 3.2 Learner (Regular User)
- Browse and enroll in published courses
- Progress through bite-sized lessons
- Take quizzes after each topic
- View progress, XP, streaks, and leaderboards
- Earn achievements and badges

---

## 4. Feature Specification

### 4.1 File Upload & Ingestion

| Attribute       | Detail                                      |
|-----------------|---------------------------------------------|
| Supported formats | PDF, TXT, Markdown                        |
| Max file size   | 50MB                                        |
| Processing      | Text extraction, chunking, metadata parsing |
| Storage         | Original file stored in object storage / filesystem |

**Flow:**
1. Operator uploads one or more files via drag-and-drop or file picker
2. System extracts text content (PDF parsing for PDFs)
3. Raw text is stored and passed to the course generation pipeline

### 4.2 AI Course Generation Pipeline

This is the **most critical feature**. The pipeline transforms raw text into a structured, deductive, engaging learning course.

#### 4.2.1 Stage 1: Content Analysis & Structuring (Author Agent)

The AI Author Agent:
1. **Analyzes** the full source material
2. **Identifies** key concepts, topics, and their relationships
3. **Creates a concept dependency graph** — which concepts depend on which
4. **Orders topics deductively** — broad → specific, prerequisite → dependent
5. **Splits into modules** — logical groupings of related topics
6. **Splits modules into bite-sized lessons** — each lesson = ONE concept, 2-3 min read
7. **Generates for each lesson:**
   - Title
   - SVG visualization (concept diagram)
   - Lesson content (clear, engaging, with analogies and examples)
   - Key takeaways
8. **Generates quiz questions per topic** (after every 3-5 lessons):
   - Multiple choice (4 options)
   - True/False
   - Fill-in-the-blank
   - Application/scenario-based questions
   - Questions aligned to Bloom's taxonomy levels (Remember → Apply → Analyze)
9. **Generates a course summary** with learning objectives

#### 4.2.2 Stage 2: AI Student Simulator (3 Review Cycles)

Before the operator sees the course, an AI Student Agent reviews it **three times**:

**Round 1 — Structural Review:**
- Are there knowledge gaps? (lesson assumes something not yet taught)
- Is the deductive flow logical?
- Are prerequisite concepts covered before dependent ones?
- Is the difficulty progression smooth?

**Round 2 — Clarity & Engagement Review:**
- Is each lesson clear and self-contained?
- Are explanations engaging or dry?
- Are analogies helpful or confusing?
- Are quiz questions fair and aligned to content?
- Would a student get bored? Where?

**Round 3 — Polish & Fun Review:**
- Is the language fun and inviting?
- Are there opportunities for "aha moments"?
- Are SVG diagrams helpful and accurate?
- Final consistency check across the entire course

After each round, the Author Agent receives feedback and revises the course.

#### 4.2.3 Stage 3: Output

The final output is a structured course object:
```
Course
├── title
├── description
├── learning_objectives[]
├── modules[]
│   ├── title
│   ├── description
│   ├── lessons[]
│   │   ├── title
│   │   ├── svg_visualization (SVG markup)
│   │   ├── content (markdown)
│   │   ├── key_takeaways[]
│   │   └── order
│   ├── quiz
│   │   ├── questions[]
│   │   │   ├── type (multiple_choice | true_false | fill_blank)
│   │   │   ├── question_text
│   │   │   ├── options[] (for multiple choice)
│   │   │   ├── correct_answer
│   │   │   ├── explanation
│   │   │   └── difficulty (easy | medium | hard)
│   │   └── passing_score
│   └── order
└── metadata
    ├── source_file
    ├── generated_at
    ├── review_cycles_log[]
    └── status (draft | in_review | published)
```

### 4.3 Operator Edit Mode (AI Co-Author)

After the AI pipeline completes, the operator enters **Edit Mode**:

#### 4.3.1 Course Walkthrough
- Operator sees the same card-by-card lesson flow as a learner
- Each element (lesson card, quiz question) has an **Edit** button
- Inline editing of text content
- Drag-and-drop reordering of lessons and modules

#### 4.3.2 Per-Element AI Chat Panel
- Every lesson card, quiz question, and answer option has a **Chat** icon
- Clicking opens a side panel with a chat interface connected to the Anthropic API
- The chat has full context of the current element AND the broader course
- Operator can:
  - Ask to simplify, rephrase, expand, add examples
  - Request alternative quiz questions
  - Ask for a different SVG visualization
  - Discuss pedagogical approach
- AI responds with suggestions
- Operator can **Accept** (replaces content), **Edit** (modify suggestion), or **Reject**

#### 4.3.3 Publishing
- Operator marks course as "Published"
- Course becomes available to learners
- Operator can unpublish or create new versions

### 4.4 SVG Concept Visualizations

Every bite-sized lesson has a **header SVG illustration**:

- **Generated by AI** as part of the course generation pipeline
- **Represents the core concept** — not decorative, but informational
- **Style**: Clean, colorful, geometric, icon-like
- **Elements**: Shapes, arrows, labels, color coding
- **Responsive**: Scales to container width
- **Editable**: Operator can request changes via the AI chat panel

**Examples:**
- "Variables" → Labeled boxes with values inside
- "HTTP Request" → Client → arrow → Server diagram
- "Recursion" → Nested function call stack visualization
- "Database Relations" → Entity boxes with connecting lines

### 4.5 Learner Experience

#### 4.5.1 Course Browser
- Grid/list of available published courses
- Course cards with title, description, progress indicator, difficulty level
- Search and filter

#### 4.5.2 Lesson View
- Full-screen card-based layout
- SVG visualization at top
- Lesson content below (rendered markdown)
- Key takeaways at bottom
- Navigation: Next / Previous / Swipe on mobile
- Progress bar at top

#### 4.5.3 Quiz View
- One question per screen
- Immediate feedback on answer (correct/wrong + explanation)
- Score summary at end
- Option to retry

### 4.6 Gamification System

| Feature          | Detail                                           |
|------------------|--------------------------------------------------|
| **XP Points**    | Earned for completing lessons (+10), quizzes (+25 base, +5 per correct), perfect quiz (+50 bonus) |
| **Streaks**      | Daily login/study streak counter. Streak freeze available. |
| **Levels**       | XP thresholds unlock levels (Level 1: 0 XP, Level 2: 100 XP, etc.) |
| **Badges**       | Achievement-based: "First Course", "Perfect Quiz", "7-Day Streak", "Speed Learner", etc. |
| **Leaderboard**  | Weekly and all-time rankings by XP |
| **Progress**     | Per-course completion percentage, overall stats dashboard |

### 4.7 Authentication & Multi-User

| Attribute       | Detail                                  |
|-----------------|-----------------------------------------|
| Method          | Email/password registration & login     |
| Sessions        | JWT-based authentication                |
| Roles           | Admin (operator), Learner               |
| Profile         | Display name, avatar, stats             |

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| **Frontend**   | Next.js 14 (App Router) + TypeScript    |
| **UI Library** | Tailwind CSS + shadcn/ui               |
| **Backend**    | Next.js API Routes (full-stack)         |
| **Database**   | PostgreSQL with Prisma ORM              |
| **Auth**       | NextAuth.js (credentials provider)      |
| **AI**         | Anthropic Claude API (SDK)              |
| **PDF Parse**  | pdf-parse (Node.js)                     |
| **File Storage**| Local filesystem (upgradeable to S3)   |
| **Deployment** | Docker / Vercel-compatible              |

### 5.2 Why Next.js?

- **Full-stack in one project** — API routes + React frontend, no separate backend
- **App Router** — Modern React Server Components, streaming, layouts
- **Mobile-optimized** — Fast initial load, prefetching, responsive by default
- **TypeScript** — Type safety across the entire stack
- **Ecosystem** — Excellent auth, ORM, and UI library support

### 5.3 Database Schema (High-Level)

```
Users
  id, email, password_hash, name, avatar_url, role, xp, level, streak_count,
  streak_last_date, created_at

Courses
  id, title, description, learning_objectives, status, source_file_path,
  created_by, created_at, published_at

Modules
  id, course_id, title, description, order, passing_score

Lessons
  id, module_id, title, svg_content, content_markdown, key_takeaways,
  order

QuizQuestions
  id, module_id, type, question_text, options, correct_answer,
  explanation, difficulty, order

UserProgress
  id, user_id, lesson_id, completed_at

QuizAttempts
  id, user_id, module_id, score, total_questions, answers_json,
  completed_at

Badges
  id, name, description, icon, criteria_type, criteria_value

UserBadges
  id, user_id, badge_id, earned_at

ChatMessages (Operator AI Chat)
  id, user_id, course_id, element_type, element_id, role, content,
  created_at

CourseReviewLogs
  id, course_id, round_number, student_feedback, author_changes,
  created_at
```

### 5.4 API Endpoints (High-Level)

```
Auth:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/logout
  GET  /api/auth/me

Courses:
  POST /api/courses/generate    (upload file + trigger generation)
  GET  /api/courses             (list courses)
  GET  /api/courses/:id         (course detail with modules/lessons)
  PUT  /api/courses/:id         (update course metadata)
  POST /api/courses/:id/publish
  DELETE /api/courses/:id

Lessons:
  GET  /api/lessons/:id
  PUT  /api/lessons/:id         (operator edit)

Quizzes:
  GET  /api/modules/:id/quiz
  POST /api/modules/:id/quiz/submit

Progress:
  GET  /api/progress            (user's progress across courses)
  POST /api/progress/complete-lesson
  GET  /api/progress/stats

Gamification:
  GET  /api/leaderboard
  GET  /api/badges
  GET  /api/user/achievements

Operator Chat:
  POST /api/chat/element        (chat with AI about a course element)
  GET  /api/chat/element/:type/:id/history
```

---

## 6. AI Prompt Strategy

### 6.1 Author Agent System Prompt (Summary)
Instructs Claude to act as an expert instructional designer who:
- Applies deductive reasoning (general → specific)
- Uses Bloom's taxonomy for question design
- Writes in an engaging, conversational tone
- Creates analogies and real-world connections
- Generates clean, informational SVG diagrams
- Structures output as structured JSON

### 6.2 Student Simulator System Prompt (Summary)
Instructs Claude to act as a beginner student who:
- Reads each lesson in order
- Flags confusion, boredom, knowledge gaps
- Attempts quizzes and reports on fairness/clarity
- Provides specific, actionable feedback
- Rates engagement, clarity, and deductive flow

### 6.3 Operator Chat System Prompt (Summary)
Instructs Claude to act as a collaborative course editor who:
- Has full context of the current element and course structure
- Suggests improvements when asked
- Can rewrite, simplify, expand, or restructure
- Generates alternative quiz questions or SVGs on request
- Explains pedagogical reasoning behind suggestions

---

## 7. Non-Functional Requirements

| Requirement      | Target                                    |
|------------------|-------------------------------------------|
| Mobile responsive| Fully usable on 320px+ screens            |
| Load time        | < 2s initial page load                    |
| Course generation| Status updates via polling/SSE during generation |
| Concurrent users | Support 100+ simultaneous learners        |
| Data integrity   | All progress saved immediately            |
| Security         | Passwords hashed (bcrypt), JWT auth, CSRF protection, input sanitization |
| Accessibility    | WCAG 2.1 AA compliance target             |

---

## 8. Future Considerations (Out of Scope for v1)

- OAuth providers (Google, GitHub login)
- Course marketplace / sharing
- Collaborative learning (study groups)
- Mobile native apps (React Native)
- Audio narration of lessons
- Code sandbox for programming courses
- Spaced repetition scheduling
- Course versioning and diff
- Export courses to PDF/SCORM
- Webhook integrations
