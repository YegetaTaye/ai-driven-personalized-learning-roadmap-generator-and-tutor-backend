# Yeneta — AI-Powered Adaptive Learning Platform

> A full-stack, microservices learning platform that builds personalised roadmaps, generates learner-specific AI explanations and quizzes, tracks mastery over time, and adapts the learning path in real time when a learner struggles or excels.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Personalization Pipeline](#personalization-pipeline)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Domain Model](#domain-model)
- [Core Learning Mechanics](#core-learning-mechanics)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seeding the Database](#seeding-the-database)
- [Frontend Pages](#frontend-pages)
- [Admin & Domain Expert Panels](#admin--domain-expert-panels)
- [Flutter Mobile App](#flutter-mobile-app)
- [Roadmap](#roadmap)

---

## Overview

Yeneta is an adaptive e-learning system built as a final-year project. Learners enrol in a domain (Frontend Development, Backend Development, Data Science, or DevOps Engineering), receive a **personalised** learning roadmap as a Directed Acyclic Graph (DAG), study topics with AI-generated explanations tailored to their experience level and learning style, take AI-generated quizzes with adaptive difficulty, and unlock the next node only after demonstrating mastery.

The platform adapts in real-time: failed quizzes trigger resource swaps, prerequisite reviews, or domain expert escalation. Knowledge decay is tracked — nodes go stale over time and prompt micro-quiz reviews. Every AI-generated artifact (explanation, quiz, instructor response) is personalised using the learner's familiarity level, learning goal, preferred style, prior skills, and performance history. A dedicated **Learning Insights** system gives learners a GitHub-style activity heatmap, velocity tracking, weak area identification, and achievement rankings — both per-course and across all enrollments.

---

## Key Features

| Category                         | Feature                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Personalised Roadmap**         | DAG shaped by familiarity level (unlock acceleration), prior skills (node subtraction), and learning goal (supplementary node injection)               |
| **Learner Context Pipeline**     | All AI calls receive a `LearnerContext` object carrying profile fields, quiz history, and performance data                                             |
| **Personalized AI Explanations** | Explanations adapted to familiarity level (depth), learning style (format), goal (examples), and prior skills (skip redundancies)                      |
| **Personalized AI Instructor**   | Context-aware chat that knows the learner's level, attempts, struggle areas, and overall progress                                                      |
| **Adaptive Quiz Difficulty**     | Quiz difficulty adjusts ±1 tier based on previous scores and overall average; quizzes are grounded in the learner's personalized explanation           |
| **Weak Area Targeting**          | After a quiz failure, wrong-answer learning outcomes are extracted and injected into the re-explanation and re-quiz                                    |
| **Gatekeeper**                   | 5-tier scoring system (strong pass → fail severe) unlocks next nodes or triggers adaptation                                                            |
| **Knowledge Decay**              | Mastered nodes degrade over time; decay-due nodes surface as micro-quiz reminders                                                                      |
| **Path Branching**               | Learners choose a specialisation at branching points (e.g. Frontend / Backend / Data Science)                                                          |
| **Timeline Estimates**           | Estimated completion dates and weekly targets derived from `weeklyHours × remainingNodeHours`, adjusted by the learner's measured velocity             |
| **Learning Velocity Tracking**   | Actual vs. estimated hours per node recorded on mastery; timeline predictions adjust in real time                                                      |
| **Resource Discovery**           | SERP API integration serves curated resources per node (videos, docs, tutorials, interactive)                                                          |
| **Resource Adaptation**          | Repeated quiz failures swap resource modality (e.g. video → interactive)                                                                               |
| **Per-Course Insights**          | Activity heatmap, profile card, velocity gauge, weak areas panel, and top achievements per enrollment                                                  |
| **Global Insights**              | Account-level cross-enrollment heatmap, per-course breakdown cards, global weak areas, and streak tracking                                             |
| **Gamification — XP & Levels**   | XP awarded on every mastery event and quiz attempt; 10-level progression tracked in a mini sidebar widget                                              |
| **Gamification — Badges**        | 8 badge types (First Master, Dedicated, Relentless, Quiz Ace, Speed Learner, Completionist, On a Roll, Comeback Kid) auto-awarded from existing events |
| **Gamification — Weekly Goal**   | Personalised weekly mastery target derived from `weeklyHours ÷ avgNodeHours`; progress bar tracks the current ISO week                                 |
| **Gamification — Streak**        | Visual day-streak counter (flame icon) with milestone XP bonuses at 5 and 14 days                                                                      |
| **My Learning**                  | Persistent sidebar tracking of active courses with last-visited node state                                                                             |
| **Domain Expert Analytics**      | Per-domain mastery rate bar charts, problem nodes, learner cohort progress, flagged events                                                             |
| **Admin Ontology Builder**       | Visual React Flow canvas to build/edit domain knowledge graphs with DAG validation and version pipeline                                                |
| **Notifications**                | In-app notifications for quiz results, decay reminders, and mastery achievements                                                                       |
| **Challenge Projects**           | Optional project prompts unlocked on strong pass                                                                                                       |

---

## Personalization Pipeline

Personalization is applied in four layers, building on each other:

### Layer 0 — Enrollment Profile

At enrollment, learners supply six profile fields that drive all downstream personalization:

| Field                    | Values                                    | Used For                                                        |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------- |
| `familiarityLevel`       | beginner / intermediate / advanced        | Explanation depth, quiz difficulty bias, unlock acceleration    |
| `learningGoal`           | get_job / upskill / hobby / certification | Example slant, supplementary node type (portfolio vs exam)      |
| `weeklyHours`            | integer                                   | Timeline estimates and velocity comparison                      |
| `preferredLearningStyle` | visual / reading / hands_on / video       | Explanation format (diagrams, code, prose)                      |
| `priorSkills`            | free text                                 | Node subtraction — known topics are auto-mastered at enrollment |
| `aboutSelf`              | free text                                 | Tone and context calibration in AI prompts                      |

### Layer 1 — Roadmap Shaping (at enrollment time)

The roadmap is personalised before the learner sees the first node:

- **Unlock acceleration** — Advanced learners auto-unlock low-difficulty nodes; intermediate learners skip entry-level nodes.
- **Node subtraction** — `priorSkills` is matched against node titles/learning outcomes; matched nodes are auto-mastered and shown as "Already known" in the canvas.
- **Node addition** — `SupplementaryNode` records are injected per enrollment: primer nodes for beginners before hard content; practice-exam nodes for certification goals; portfolio-project nodes for job-seekers.

### Layer 2 — AI Content Personalization (per-request)

Every AI call (explanation, quiz, instructor) receives a `LearnerContext` object built at request time:

```
LearnerContext {
  familiarityLevel, learningGoal, weeklyHours, aboutSelf,
  preferredLearningStyle, priorSkills,          ← enrollment profile
  currentNodeAttempts, currentNodeBestScore,    ← node performance
  overallAvgScore, nodesCompleted, totalNodes   ← aggregate progress
}
```

The AI service injects this context into prompt builders, producing:

- Explanations that scale from analogies (beginner) to edge-case analysis (advanced)
- Quizzes with difficulty adapted to the learner's recent performance
- Instructor responses that acknowledge how many times the learner has attempted the node

### Layer 3 — Adaptive Remediation (post-failure)

When a learner fails a quiz, the system:

1. Queries `QuizAttempt.answers` to extract weak learning outcomes (questions answered incorrectly)
2. Passes `weakAreas` to the re-explanation and re-quiz prompts
3. Re-quiz weights 50% of questions toward the identified weak outcomes
4. Remedial quiz cache (`quiz:remedial:{nodeId}:{hash}`, 2h TTL) is invalidated when the learner passes

### Layer 4 — Velocity Intelligence

`LearnerVelocity` records actual vs. estimated hours per mastered node. The average velocity ratio feeds back into timeline estimates:

- `adjustedRemainingHours = remainingHours × avgVelocityRatio`
- The sidebar shows "X% faster / slower than expected" with colour-coded feedback

### Tiered Cache Strategy

| Tier                                   | Key Pattern                                    | TTL | Scope                          |
| -------------------------------------- | ---------------------------------------------- | --- | ------------------------------ |
| 1 — Shared by familiarity              | `explanation:{nodeId}:{familiarityLevel}`      | 24h | All learners at same level     |
| 2 — Shared by difficulty + familiarity | `quiz:ai:{nodeId}:d{difficulty}:{familiarity}` | 7d  | All learners at same profile   |
| 3 — Per-learner remedial               | `quiz:remedial:{nodeId}:{hash(weakAreas)}`     | 2h  | Single learner's weak area set |
| 4 — Uncached                           | —                                              | —   | AI instructor chat             |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Mobile                          │
│                  React (Vite) · Flutter (mobile)                │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP / REST  (all via /api/v1/*)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Nginx  :8080                              │
│              Reverse proxy + static file serving                 │
└────────────┬──────────────────────────────────┬─────────────────┘
             │                                  │
             ▼                                  ▼
┌────────────────────────┐          ┌───────────────────────────┐
│     api-gateway :3000  │          │    ai-service :3002        │
│                        │          │                            │
│  • JWT auth (RS256)    │          │  • Learner-aware prompts   │
│  • Refresh tokens      │◄────────►│  • Adaptive quiz gen       │
│  • RBAC middleware     │  HTTP    │  • Remedial cache control  │
│  • User management     │          │  • Redis tiered cache      │
│  • Admin user ops      │          │  • Circuit breaker         │
│  • Request proxying    │          │  • Gemini fallback         │
└────────────┬───────────┘          └───────────────────────────┘
             │ HTTP
             ▼
┌──────────────────────────┐
│  learning-service :3001   │
│                           │
│  • Domains & ontology     │
│  • Enrollments + shaping  │
│  • Roadmap + supp. nodes  │
│  • Learner context build  │
│  • Gatekeeper / scoring   │
│  • Quizzes & attempts     │
│  • Knowledge decay        │
│  • Velocity tracking      │
│  • Timeline estimates     │
│  • Activity heatmap data  │
│  • Per-course insights    │
│  • Global insights        │
│  • Resources & ratings    │
│  • Path branching         │
│  • Domain expert analytics│
│  • Admin CRUD             │
│  • Notifications          │
└────────────┬──────────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
┌─────────┐    ┌──────────┐
│Postgres │    │  Redis   │
│  :5433  │    │  :6380   │
│ (Prisma)│    │  cache   │
└─────────┘    └──────────┘
```

All three services are built with **Express + TypeScript**, containerised with Docker Compose, and share a single PostgreSQL database with schema-per-service organisation.

---

## Tech Stack

### Backend

| Layer            | Technology                                                              |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime          | Node.js 20, TypeScript 5                                                |
| Framework        | Express 4                                                               |
| ORM              | Prisma 5 (PostgreSQL)                                                   |
| Auth             | JWT (access + refresh tokens), bcrypt                                   |
| Validation       | Joi                                                                     |
| AI               | Ollama (primary) · Google Gemini API fallback (`@google/generative-ai`) |
| Resource search  | SERP API (`serpapi`)                                                    |
| Caching          | Redis via ioredis (4-tier strategy)                                     |
| Logging          | Pino + pino-http                                                        |
| API Docs         | Swagger (swagger-jsdoc + swagger-ui-express)                            |
| Containerisation | Docker + Docker Compose                                                 |
| Reverse proxy    | Nginx                                                                   |

### Frontend

| Layer             | Technology                                       |
| ----------------- | ------------------------------------------------ |
| Framework         | React 18 + TypeScript + Vite                     |
| Routing           | React Router v6                                  |
| State (server)    | TanStack Query v5                                |
| State (client)    | Zustand (with `persist` middleware)              |
| Styling           | Tailwind CSS v4                                  |
| Forms             | React Hook Form + Zod                            |
| DAG visualisation | React Flow (`@xyflow/react`) + Dagre layout      |
| Charts            | Recharts                                         |
| HTTP client       | Axios                                            |
| Fonts             | Cormorant Garamond, Crimson Text, JetBrains Mono |
| Testing           | Vitest + Testing Library + MSW                   |

### Infrastructure

| Component        | Technology     |
| ---------------- | -------------- |
| Database         | PostgreSQL 16  |
| Cache / pub-sub  | Redis 7        |
| Containerisation | Docker Compose |
| Reverse proxy    | Nginx Alpine   |

---

## Repository Structure

```
fyp/
├── backend/
│   ├── docker-compose.yml
│   ├── nginx/nginx.conf
│   └── services/
│       ├── api-gateway/          # Auth, user management, RBAC, request proxying
│       │   └── src/
│       │       ├── modules/auth/
│       │       ├── modules/users/
│       │       └── modules/admin/
│       ├── learning-service/     # Core learning domain
│       │   ├── prisma/
│       │   │   ├── schema.prisma        # Enrollment, LearnerNodeProgress,
│       │   │   │                        # SupplementaryNode, LearnerVelocity
│       │   │   ├── seed.ts
│       │   │   └── seeds/               # 9 seed files
│       │   └── src/
│       │       └── modules/
│       │           ├── adaptation/      # Resource modality swap
│       │           ├── admin/           # Admin stats, user/domain ops
│       │           ├── branching/       # Path selection at fork nodes
│       │           ├── decay/           # Knowledge decay scoring
│       │           ├── domains/         # Domain CRUD
│       │           ├── enrollments/     # Enrol + roadmap shaping
│       │           ├── gatekeeper/      # Quiz scoring, unlock, velocity recording
│       │           │   └── velocity.service.ts  # Actual vs. estimated hours
│       │           ├── instructor/      # Instructor analytics & flagged events
│       │           ├── notifications/   # In-app notification dispatch
│       │           ├── ontology/        # Version pipeline, nodes, edges, DAG utils
│       │           ├── progress/        # Mastery state machine, timeline, insights
│       │           │   └── learner-context.service.ts  # Context builder for AI
│       │           ├── serp/            # SERP resource discovery
│       │           ├── quizzes/         # Quiz fetch + attempt submission
│       │           └── resources/       # Manual resources + ratings
│       └── ai-service/           # AI wrapper (Ollama primary, Gemini fallback)
│           └── src/
│               └── modules/ai/
│                   ├── ollama.client.ts
│                   ├── gemini.client.ts
│                   ├── ai.cache.ts          # 4-tier cache + remedial invalidation
│                   ├── ai.circuit-breaker.ts
│                   └── prompts/             # Learner-context-aware prompt builders
│                       ├── explanationGeneration.ts
│                       ├── quizGeneration.ts
│                       └── askQuestion.ts
├── frontend/
│   └── src/
│       ├── api/              # TanStack Query hooks per domain
│       ├── components/
│       │   ├── layout/       # AppShell, Navbar, Sidebar, BottomNav
│       │   └── ui/           # Shared UI primitives
│       ├── features/
│       │   ├── admin/        # Ontology builder, domain mgmt, user mgmt, stats
│       │   ├── auth/         # Login, register pages
│       │   ├── catalog/      # Domain catalog + enrol sheet (6-field profile)
│       │   ├── dashboard/    # Learner dashboard + enrollments
│       │   ├── insights/     # Per-course & global learning intelligence pages
│       │   │   └── components/
│       │   │       ├── ActivityHeatmap.tsx   # GitHub-style 52-week grid
│       │   │       ├── CurrentStatePanel.tsx # Completion, streak, momentum
│       │   │       ├── ProfileCard.tsx       # All enrollment profile fields
│       │   │       ├── VelocityCard.tsx      # Velocity gauge + timeline rows
│       │   │       ├── WeakAreasPanel.tsx    # Decay + struggling nodes
│       │   │       └── TopAchievementsPanel.tsx
│       │   ├── instructor/   # Instructor analytics pages
│       │   ├── learn/        # Learn page, AI explanation, inline quiz
│       │   ├── quiz/         # Quiz state machine, outcome screen
│       │   ├── roadmap/      # React Flow DAG roadmap
│       │   │   └── components/
│       │   │       ├── LearningNodeCard.tsx  # auto-mastered "Already known" visual
│       │   │       └── RoadmapCanvas.tsx
│       │   ├── resources/    # Resource browser + ratings
│       │   ├── notifications/# Notification centre
│       │   ├── decay/        # Decay reminder UI
│       │   └── branching/    # Path branch selector
│       ├── store/            # Zustand stores (auth, myLearning)
│       └── types/            # Shared TypeScript types
├── docs/
│   ├── backend/              # Phase-by-phase backend implementation docs
│   ├── frontend/             # Phase-by-phase web frontend docs
│   └── frontend-mobile/      # Phase-by-phase Flutter mobile docs (10 phases)
└── PERSONALIZATION_PLAN.md   # Full audit + 4-phase enhancement plan
```

---

## Domain Model

```
User ──────────────────────────────────────────────────────────────┐
  │                                                                 │
  │ enrolls in                                                      │
  ▼                                                                 │
Enrollment ────── references ──────► OntologyVersion               │
  │  (familiarityLevel, learningGoal,   │                          │
  │   weeklyHours, preferredStyle,      │ has many                 │
  │   priorSkills, aboutSelf,           ▼                          │
  │   selectedBranchPath)         LearningNode ◄── NodePrerequisite│
  │                                     │                          │
  ├── has many ──► SupplementaryNode    │ has many                 │
  │   (primer / practice_exam /         ├── Quiz ──► QuizQuestion  │
  │    portfolio_project)               ├── Resource               │
  │                                     ├── ChallengeProject       │
  ├── has many ──► LearnerNodeProgress  └── AdaptationEvent ───────┘
  │   (masteryState, unlocked,
  │    attemptsCount, bestQuizScore,
  │    isAutoMastered)
  │     │
  │     │ has many
  │     ▼
  │   QuizAttempt ──► (score, outcome, answers, weakAreas)
  │
  └── has many ──► LearnerVelocity
      (nodeId, estimatedHours, actualHours,
       velocityRatio, startedAt, completedAt)
```

### Key Enums

```
MasteryState:          not_started | in_progress | mastered | review_needed | relearn
QuizOutcome:           strong_pass | marginal_pass | fail_low | fail_fundamental | fail_severe
OntologyStatus:        draft | in_review | verified | published | archived
AdaptationType:        resource_swap | prerequisite_review | instructor_escalation | decay_micro_quiz
BranchPath:            frontend | backend | data_science
UserRole:              learner | domain_expert | admin
ResourceModality:      video | tutorial | documentation | interactive | reference
FamiliarityLevel:      beginner | intermediate | advanced
LearningGoal:          get_job | upskill | hobby | certification
PreferredLearningStyle: visual | reading | hands_on | video
SupplementaryNodeType: primer | practice_exam | portfolio_project
```

---

## Core Learning Mechanics

### 1. Ontology — Skeleton & Flesh

The knowledge graph is **human-authored** (the skeleton). Admins define nodes, their prerequisites, branching points, and convergence points through a visual React Flow canvas. Gemini generates only prose and quiz questions **grounded in the node's defined learning outcomes** — it cannot invent new topics.

The ontology goes through a 5-stage publishing pipeline:  
`draft → in_review → verified → published → archived`

### 2. Personalised Roadmap Generation

When a learner enrols, the system applies three layers of roadmap shaping before the learner sees a single node:

1. **Unlock acceleration** — Based on `familiarityLevel`:
   - `advanced`: auto-unlock nodes with `difficultyLevel ≤ 2`; auto-master `difficultyLevel = 1` nodes entirely
   - `intermediate`: auto-unlock `difficultyLevel = 1` nodes
   - `beginner`: only root nodes (no prerequisites) unlocked

2. **Node subtraction** — `priorSkills` keywords are matched against node titles and learning outcomes. Matched nodes are auto-mastered (`masteryState = 'mastered'`, `isAutoMastered = true`). They appear in the roadmap as greyed-out "Already known" cards and don't interrupt the learner's path, but count as mastered for prerequisite unlocking.

3. **Node addition** — Enrollment-specific `SupplementaryNode` records are injected:
   - `beginner` learner + `difficultyLevel ≥ 4` node → **primer node** inserted before (AI-generated foundational content)
   - `learningGoal = 'certification'` → **practice exam node** at end of each branch
   - `learningGoal = 'get_job'` → **portfolio project node** at branch convergence points

A post-enrollment summary dialog shows: "Skipped N nodes you already know · Added N primer nodes for fundamentals."

### 3. Gatekeeper — 5-Tier Scoring

Every quiz attempt is classified:

| Score  | Tier               | Outcome                                                                          |
| ------ | ------------------ | -------------------------------------------------------------------------------- |
| ≥ 80%  | `strong_pass`      | Node mastered; next nodes unlocked; challenge project offered; velocity recorded |
| 70–79% | `marginal_pass`    | Node mastered; next nodes unlocked; velocity recorded                            |
| 50–69% | `fail_low`         | Resources swapped (modality change)                                              |
| 30–49% | `fail_fundamental` | Prerequisite review triggered                                                    |
| < 30%  | `fail_severe`      | Instructor escalation flagged                                                    |

On pass: `LearnerVelocity` is upserted for the node and any remedial quiz cache for that node is invalidated.

### 4. Knowledge Decay

Mastered nodes go stale over time:

| Mastery Level | Decay Window |
| ------------- | ------------ |
| Strong pass   | 14 days      |
| Marginal pass | 7 days       |
| Relearn       | 30 days      |

A background decay check runs on each roadmap load. Nodes past their window transition to `review_needed` and trigger an in-app notification. The learner must retake a micro-quiz (3 questions) to re-validate mastery.

### 5. AI Generation Pipeline

The **ai-service** is isolated and stateless. All calls from learning-service include an optional `learnerContext` payload:

```
Request (with LearnerContext)
  → Cache lookup (tiered key including familiarityLevel, adaptedDifficulty)
  → Circuit breaker (open after 3 failures, 30s reset)
  → Prompt builder (injects learner context section)
  → Ollama      (primary, local)
  → Gemini API  (fallback)
  → Structured response validation
  → Cache write (tier 1–3 depending on content type)
  → Response
```

Prompt builders inject a **Learner Profile** section covering experience level, goal, style, prior skills, performance history, and weak areas. Explanations vary by familiarity level (up to 4 cached variants per node). Quiz difficulty adapts ±1 based on the learner's recent scores.

### 6. Learning Velocity Tracking

When a node is mastered, `velocity.service.ts` records:

- `startedAt` — first quiz attempt timestamp for the user + node
- `completedAt` — passing attempt timestamp
- `actualHours` — time difference in hours
- `velocityRatio` — `actualHours / estimatedHours` (< 1 = faster, > 1 = slower)

`getTimelineEstimate()` uses `avgVelocityRatio` to produce an `adjustedRemainingHours` and a "Your pace" indicator on the roadmap sidebar.

### 7. Learning Insights

Two insights surfaces are available:

**Per-course (`/enrollments/:id/insights`)**

- 52-week GitHub-style **activity heatmap** (quizzes + reviews + masteries, 5-level intensity)
- **Current state panel** — completion %, active streak, avg quiz score, days enrolled, momentum banner
- **Profile card** — all six enrollment fields displayed
- **Velocity card** — gauge bar (2× slower ↔ 2× faster), timeline rows, estimated completion date
- **Weak areas panel** — knowledge decay nodes and struggling nodes (≥ 2 attempts)
- **Top achievements** — hardest mastered nodes ranked by difficulty with quiz score and mastery date

**Global / account-level (`/insights`)**

- Cross-enrollment **activity heatmap** (all courses combined)
- **Overall stats** — avg completion %, total mastered nodes, avg quiz score, day streak
- **Momentum banner** — this week vs. last week mastery trend
- **Per-course breakdown cards** — colour-coded progress bars, click to navigate to that roadmap
- **Global knowledge gaps** — review-needed/relearn nodes across all courses with domain context
- **Global top achievements** — hardest mastered nodes globally

### 8. Resource Discovery

The **serp module** queries the SERP API with the node title + domain context. Results are normalised into `Resource` records with detected modality, stored per-node, and served with learner ratings.

---

## API Reference

All routes are prefixed `/api/v1/` and proxied through the Nginx reverse proxy.

### api-gateway (:3000)

| Method   | Path                        | Auth   | Description                            |
| -------- | --------------------------- | ------ | -------------------------------------- |
| `POST`   | `/auth/register`            | Public | Register a new learner                 |
| `POST`   | `/auth/login`               | Public | Login, receive access + refresh tokens |
| `POST`   | `/auth/refresh`             | Public | Rotate refresh token                   |
| `POST`   | `/auth/logout`              | Bearer | Invalidate refresh token               |
| `GET`    | `/users/me`                 | Bearer | Get current user                       |
| `PATCH`  | `/users/me`                 | Bearer | Update profile                         |
| `POST`   | `/users/me/change-password` | Bearer | Change password                        |
| `DELETE` | `/users/me`                 | Bearer | Delete account                         |
| `GET`    | `/admin/users`              | Admin  | List all users with filters            |
| `PATCH`  | `/admin/users/:id/role`     | Admin  | Change user role                       |
| `DELETE` | `/admin/users/:id`          | Admin  | Delete user                            |
| `GET`    | `/admin/stats`              | Admin  | System-wide KPIs                       |
| `GET`    | `/admin/stats/domains`      | Admin  | Per-domain statistics                  |

### learning-service (:3001)

**Domains & Ontology**

| Method   | Path                            | Auth   | Description                          |
| -------- | ------------------------------- | ------ | ------------------------------------ |
| `GET`    | `/domains`                      | Bearer | List all domains                     |
| `POST`   | `/domains`                      | Admin  | Create domain                        |
| `PATCH`  | `/domains/:id`                  | Admin  | Update domain                        |
| `GET`    | `/domains/:domainId/ontologies` | Bearer | List ontology versions               |
| `POST`   | `/domains/:domainId/ontologies` | Admin  | Create new draft version             |
| `GET`    | `/ontologies/:id`               | Bearer | Get version with all nodes and edges |
| `PATCH`  | `/ontologies/:id/status`        | Admin  | Transition status pipeline           |
| `GET`    | `/ontologies/:id/validate`      | Admin  | Run DAG validation                   |
| `POST`   | `/ontologies/:id/nodes`         | Admin  | Add node to draft                    |
| `PATCH`  | `/nodes/:id`                    | Admin  | Update node                          |
| `DELETE` | `/nodes/:id`                    | Admin  | Delete node                          |
| `POST`   | `/nodes/:id/prerequisites`      | Admin  | Add prerequisite edge                |
| `DELETE` | `/prerequisites/:id`            | Admin  | Remove prerequisite edge             |

**Enrollments & Roadmap**

| Method | Path                        | Auth   | Description                                         |
| ------ | --------------------------- | ------ | --------------------------------------------------- |
| `POST` | `/enrollments`              | Bearer | Enrol in a domain (returns personalization summary) |
| `GET`  | `/enrollments`              | Bearer | List learner's enrollments                          |
| `GET`  | `/enrollments/:id/roadmap`  | Bearer | Get personalised DAG + supplementary nodes          |
| `GET`  | `/enrollments/:id/branches` | Bearer | List available branch paths                         |
| `POST` | `/enrollments/:id/branch`   | Bearer | Select or change branch path                        |

**Progress, Timeline & Insights**

| Method | Path                              | Auth   | Description                                                                      |
| ------ | --------------------------------- | ------ | -------------------------------------------------------------------------------- |
| `GET`  | `/enrollments/:id/progress`       | Bearer | All node progress rows for the enrollment                                        |
| `GET`  | `/enrollments/:id/progress/stats` | Bearer | Stats: completion %, mastered count, avg score, streak                           |
| `GET`  | `/enrollments/:id/timeline`       | Bearer | Estimated completion — remaining hours, velocity-adjusted weeks, target date     |
| `GET`  | `/enrollments/:id/activity`       | Bearer | Daily activity counts for last 52 weeks (heatmap data)                           |
| `GET`  | `/enrollments/:id/insights`       | Bearer | Full learning intelligence: profile, velocity, weak areas, top nodes, momentum   |
| `GET`  | `/me/activity`                    | Bearer | Global activity heatmap across all enrollments                                   |
| `GET`  | `/me/insights`                    | Bearer | Global insights: per-course breakdowns, global weak areas, overall stats, streak |

**Quizzes & Attempts**

| Method | Path                      | Auth   | Description                                                                       |
| ------ | ------------------------- | ------ | --------------------------------------------------------------------------------- |
| `GET`  | `/nodes/:id/quiz`         | Bearer | Get (or generate) personalised quiz for a node                                    |
| `POST` | `/nodes/:id/quiz/attempt` | Bearer | Submit quiz attempt (triggers gatekeeper, velocity recording, cache invalidation) |
| `GET`  | `/nodes/:id/quiz/history` | Bearer | Quiz attempt history                                                              |
| `GET`  | `/nodes/:id/progress`     | Bearer | Get node mastery state                                                            |
| `POST` | `/nodes/:id/explain`      | Bearer | Get (or generate) personalised explanation                                        |
| `POST` | `/nodes/:id/ask`          | Bearer | Ask the AI instructor a contextualised question                                   |

**Resources**

| Method | Path                            | Auth   | Description                     |
| ------ | ------------------------------- | ------ | ------------------------------- |
| `GET`  | `/nodes/:id/resources`          | Bearer | List resources for node         |
| `POST` | `/nodes/:id/resources/discover` | Bearer | Trigger SERP resource discovery |
| `POST` | `/resources/:id/rate`           | Bearer | Rate a resource                 |

**Domain Expert**

| Method  | Path                                      | Auth          | Description               |
| ------- | ----------------------------------------- | ------------- | ------------------------- |
| `GET`   | `/instructor/learners`                    | Domain Expert | List enrolled learners    |
| `GET`   | `/instructor/learners/:id/progress`       | Domain Expert | Per-learner node progress |
| `GET`   | `/instructor/learners/:id/quiz-history`   | Domain Expert | Learner quiz history      |
| `GET`   | `/instructor/domains/:domainId/analytics` | Domain Expert | Mastery rate chart data   |
| `GET`   | `/instructor/flagged`                     | Domain Expert | Flagged adaptation events |
| `PATCH` | `/instructor/flagged/:id/resolve`         | Domain Expert | Resolve flagged event     |

**Notifications**

| Method  | Path                      | Auth   | Description        |
| ------- | ------------------------- | ------ | ------------------ |
| `GET`   | `/notifications`          | Bearer | List notifications |
| `PATCH` | `/notifications/:id/read` | Bearer | Mark as read       |
| `PATCH` | `/notifications/read-all` | Bearer | Mark all read      |

### ai-service (:3002)

| Method   | Path                         | Description                                                                         |
| -------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| `POST`   | `/ai/explain`                | Generate personalised explanation (accepts `learnerContext`)                        |
| `POST`   | `/ai/quiz`                   | Generate adaptive quiz (accepts `learnerContext`, `adaptedDifficulty`, `weakAreas`) |
| `POST`   | `/ai/micro-quiz`             | Generate 3-question decay micro-quiz                                                |
| `POST`   | `/ai/ask`                    | AI instructor answer (uncached, full learner context)                               |
| `DELETE` | `/ai/cache/remedial/:nodeId` | Invalidate all remedial quiz cache entries for a node                               |
| `GET`    | `/ai/health`                 | Circuit breaker status + cache stats                                                |

---

## Getting Started

### Prerequisites

- Docker ≥ 24 and Docker Compose v2
- Node.js 20 (for local frontend development)
- Ollama running locally (primary AI inference)
- A SERP API key (resource discovery)
- (Optional) A Google Gemini API key (AI fallback)

### 1. Clone and configure

```bash
git clone https://github.com/YegetaTaye/Yeneta.git
cd Yeneta/backend
cp .env.example .env
# Fill in GEMINI_API_KEY, SERPER_API_KEY, JWT_SECRET, etc.
```

### 2. Start the backend

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL, Redis, api-gateway, learning-service, ai-service, and Nginx.

### 3. Run database migrations and seed

```bash
# Migrations are applied automatically on container start via Prisma
# To seed all domains and ontologies:
docker compose exec learning-service npx prisma db seed
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

The Vite dev server proxies all `/api/v1/` requests to the Nginx reverse proxy on port 8080.

### Service ports

| Service              | Host Port |
| -------------------- | --------- |
| Nginx (API + static) | 8080      |
| api-gateway          | 3000      |
| learning-service     | 3001      |
| ai-service           | 3002      |
| PostgreSQL           | 5433      |
| Redis                | 6380      |

---

## Environment Variables

### api-gateway / learning-service

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/learner_roadmap
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-here
AI_SERVICE_URL=http://ai-service:3002
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### ai-service

```env
NODE_ENV=development
OLLAMA_BASE_URL=http://localhost:11434    # Primary AI inference
SERPER_API_KEY=your-serper-api-key        # SERP resource discovery
GEMINI_API_KEY=your-gemini-api-key        # Fallback AI (optional)
REDIS_URL=redis://redis:6379
```

---

## Seeding the Database

The seed pipeline in `backend/services/learning-service/prisma/seeds/` loads all initial data:

| File                           | Contents                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `001_domains.ts`               | 4 domains: Frontend, Backend, Data Science, DevOps Engineering |
| `002_frontend_ontology.ts`     | ~30 nodes for Frontend Development (published)                 |
| `003_frontend_quizzes.ts`      | Manually authored quiz questions for frontend nodes            |
| `004_challenge_projects.ts`    | Challenge project prompts per node                             |
| `005_domain_whitelist.ts`      | Allowed domain slugs for SERP queries                          |
| `006_manual_resources.ts`      | Curated initial resources per node                             |
| `007_backend_ontology.ts`      | 30 nodes for Backend Development (published)                   |
| `008_data_science_ontology.ts` | 19 nodes for Data Science (published)                          |
| `009_devops_ontology.ts`       | 16 nodes for DevOps Engineering (published)                    |

Run with:

```bash
docker compose exec learning-service npx prisma db seed
```

All ontology seeds are idempotent — re-running skips already-seeded versions.

---

## Frontend Pages

| Route                            | Page            | Description                                                                                |
| -------------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| `/login`                         | Login           | JWT authentication                                                                         |
| `/register`                      | Register        | Account creation with role selection                                                       |
| `/dashboard`                     | Dashboard       | Enrolled courses, progress overview                                                        |
| `/catalog`                       | Catalog         | Domain browser with enrolment sheet (6-field learner profile)                              |
| `/insights`                      | Global Insights | Account-level heatmap, per-course breakdown, global weak areas, streak                     |
| `/achievements`                  | Achievements    | XP level bar, streak card, weekly goal, full badge grid, recent XP event feed              |
| `/enrollments/:id/roadmap`       | Roadmap         | Interactive DAG with mastery badges, auto-mastered "Already known" nodes, timeline sidebar |
| `/enrollments/:id/insights`      | Course Insights | Heatmap, profile card, velocity gauge, weak areas, top achievements                        |
| `/enrollments/:id/learn/:nodeId` | Learn           | Personalised AI explanation + inline quiz                                                  |
| `/quiz/:nodeId`                  | Quiz            | Full quiz flow with adaptive difficulty                                                    |
| `/quiz-attempts/:id`             | Attempt Review  | Score breakdown with weak area analysis                                                    |
| `/profile`                       | Profile         | Edit name, avatar, preferred language                                                      |
| `/settings`                      | Settings        | Password change, learning defaults, danger zone                                            |
| `/notifications`                 | Notifications   | In-app notification centre                                                                 |
| `/admin/*`                       | Admin           | Stats, user management, domain & ontology management                                       |
| `/instructor/*`                  | Domain Expert   | Learner cohort, analytics, flagged events                                                  |

### My Learning (sidebar)

After a learner generates their first AI explanation, the course is added to a persistent **My Learning** section in the global sidebar, powered by Zustand's `persist` middleware (`localStorage`). It highlights the active course and remembers the last-visited node so learners can resume instantly.

### Insights (sidebar)

A global **Insights** button (✦ sparkle icon) in the main sidebar and mobile bottom nav links to `/insights` — the account-level intelligence dashboard aggregating activity and progress across all enrolled courses.

---

## Gamification

Gamification is applied on top of the existing learning loop — it uses events and data the system already tracks, with no change to core learning mechanics.

### XP & Levels

| Event                                | XP      |
| ------------------------------------ | ------- |
| Node mastered (strong pass ≥ 80%)    | +100 XP |
| Node mastered (marginal pass 70–79%) | +60 XP  |
| Any quiz attempt                     | +10 XP  |
| Spaced review completed              | +20 XP  |
| Streak milestone (5 days)            | +50 XP  |
| Streak milestone (14 days)           | +100 XP |
| Full enrollment completed            | +300 XP |

**Level thresholds** (10 levels): 0 · 200 · 500 · 900 · 1 400 · 2 000 · 2 700 · 3 500 · 4 400 · 5 400 XP

A **mini XP bar + streak widget** sits at the top of the main sidebar (collapsed: trophy icon + level number). It updates automatically after every quiz submission.

### Badges

| Badge             | Trigger                                        |
| ----------------- | ---------------------------------------------- |
| **First Master**  | Mastered first node                            |
| **Dedicated**     | 5-day streak                                   |
| **Relentless**    | 14-day streak                                  |
| **Quiz Ace**      | 100% score on any quiz                         |
| **Speed Learner** | Mastered a node in < 50% of its estimated time |
| **Completionist** | All nodes mastered in an enrollment            |
| **On a Roll**     | Weekly goal hit                                |
| **Comeback Kid**  | Node went from Relearn → Mastered              |

Each badge is awarded exactly once per learner (idempotent `upsert`). Locked badges are shown as greyed-out cards on the Achievements page so learners always see the full set of goals.

### Weekly Goal

The goal target is personalised:

```
target = max(1, round(weeklyHours / avgNodeEstimatedHours))
```

Progress is derived from `LearnerNodeProgress.masteredAt` within the current ISO week — no additional table writes required.

### Architecture

Three new Prisma models:

| Model       | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `UserXp`    | Aggregate XP + level per user (one row, upserted on every award) |
| `XpEvent`   | Immutable log of every XP grant (source, amount, optional refId) |
| `UserBadge` | One row per earned badge, unique on `(userId, badgeKey)`         |

The gamification service hooks into `gatekeeper.service.ts` via **fire-and-forget** calls (`awardXp(...).catch(() => {})`) so the quiz response is never delayed by gamification writes.

### API

| Method | Endpoint           | Auth   | Description                                                                              |
| ------ | ------------------ | ------ | ---------------------------------------------------------------------------------------- |
| `GET`  | `/me/gamification` | Bearer | Full gamification summary: XP, level, streak, all badges, weekly goal, last 10 XP events |

---

## Admin & Domain Expert Panels

### Admin — Ontology Builder

Admins access `/admin/domains`, expand any domain, and click **Open** on an ontology version to enter the React Flow canvas editor.

**Canvas interactions:**

- Nodes are auto-laid-out into a readable DAG hierarchy on first open (topological level layout)
- Drag nodes to set positions (saved on drag-stop)
- Click a node → Edit panel slides in from the right with all current values pre-filled
- Right-click canvas → Add new node dialog (title, slug, description, learning outcomes, branch path)
- Draw edges between nodes to set prerequisites (cycle detection prevents invalid DAGs)
- Click an edge → confirm dialog to delete the prerequisite

**Version pipeline:**
Creating a new version copies all nodes and edges from the latest published version — so edits start from the known-good state, not a blank canvas. Versions flow through `draft → in_review → verified → published`.

**Validation:**
The **Validate DAG** button runs server-side checks for: self-referencing nodes, cycles, and orphan nodes (unreachable from any root).

### Domain Expert — Analytics

Domain experts see per-domain mastery rate bar charts with colour-coded thresholds (green ≥ 70%, amber ≥ 40%, red < 40%), problem node lists, enrollment counts, and a resolution workflow for flagged adaptation events.

---

## Flutter Mobile App

The Flutter mobile app is implemented in [`/flutter_mobile`](flutter_mobile/). A phase-by-phase implementation plan is documented in [`docs/frontend-mobile/`](docs/frontend-mobile/), covering 10 phases from scaffold through polish and CI/CD:

| Phase | Focus                                                                                      |
| ----- | ------------------------------------------------------------------------------------------ |
| 0     | Architecture overview, tech stack decisions                                                |
| 1     | Project scaffold, routing, t <p className="text-[14px] mt-1" style={{ color: '#6e645a' }}> |

          {insights.totalEnrollments} enrolled course{insights.totalEnrollments !== 1 ? 's' : ''} ·{' '}
          {overallStats.masteredNodes} nodes mastered overall
        </p>heme, auth state |

| 2 | Authentication screens |
| 3 | Catalog and enrolment |
| 4 | Roadmap DAG with `graphview` |
| 5 | Learn screen + AI explanation |
| 6 | Quiz flow + outcome screen |
| 7 | Resources, knowledge decay, notifications |
| 8 | Branching, profile, settings |
| 9 | Instructor & admin panels |
| 10 | Polish, widget tests, CI/CD (GitHub Actions) |

The Flutter app uses **Riverpod** for state management, **go_router** for navigation, **Dio** for HTTP, and **flutter_secure_storage** for token persistence.

---

## Roadmap

- [x] 4 domain ontologies (Frontend, Backend, Data Science, DevOps)
- [x] AI explanation + quiz generation with caching and circuit breaker
- [x] Gatekeeper 5-tier scoring and node unlocking
- [x] Knowledge decay tracking and micro-quiz reminders
- [x] Path branching and convergence
- [x] SERP resource discovery and resource adaptation
- [x] Domain expert analytics dashboard
- [x] Admin ontology builder (React Flow canvas, version pipeline)
- [x] My Learning persistent sidebar
- [x] In-app notification system
- [x] Flutter mobile app (see [`/flutter_mobile`](flutter_mobile/))
- [x] Extended enrollment profile (preferredLearningStyle, priorSkills)
- [x] Learner context pipeline — all AI calls carry full learner profile + performance history
- [x] Personalized AI explanations (familiarity-level, learning-style, goal, prior skills aware)
- [x] Personalized AI instructor (context-aware chat)
- [x] Adaptive quiz difficulty (adjusts ±1 tier based on performance)
- [x] Weak area targeting — post-failure re-explanation and re-quiz focus on wrong answers
- [x] Roadmap shaping — unlock acceleration, node subtraction (priorSkills), supplementary node injection
- [x] Estimated timelines with velocity multiplier
- [x] Learning velocity tracking (LearnerVelocity model, actual vs. estimated hours)
- [x] Tiered cache strategy (4 tiers, remedial cache invalidation on pass)
- [x] Per-course Learning Insights page (heatmap, profile, velocity, weak areas, achievements)
- [x] Global Insights page (account-level, cross-enrollment heatmap and breakdown)
- [x] Gamification — XP system (10 levels, 6 event sources, fire-and-forget award hook)
- [x] Gamification — 8 badge types, auto-awarded from existing mastery/streak/velocity events
- [x] Gamification — personalised weekly goal derived from weeklyHours ÷ avgNodeHours
- [x] Gamification — day-streak counter with milestone XP bonuses at 5 and 14 days
- [x] Achievements page (`/achievements`) — XP bar, streak, weekly goal, badge grid, XP feed
- [x] Mini XP + streak sidebar widget (expanded and collapsed modes)
- [ ] WebSocket real-time notifications
- [ ] Export progress report (PDF)
- [ ] LTI integration for institutional use
- [ ] Multi-language AI explanations (ISO 639-1 preferred language)

---

## License

This project was developed as a final-year project. All rights reserved.
