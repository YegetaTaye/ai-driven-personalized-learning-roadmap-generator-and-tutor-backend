# Flutter Mobile — Project Overview & Tech Stack

**Backend base URL (dev):**

- Android emulator: `http://10.0.2.2:8080/api/v1`
- iOS simulator: `http://localhost:8080/api/v1`
- Physical device: `http://<machine-LAN-IP>:8080/api/v1`

Same nginx proxy, same REST API, same JWT flow as the web frontend.

---

## Product Summary

A native mobile application for the Yeneta adaptive learning platform. The same three user experiences as the web, optimised for touch and small screen:

| Role           | Primary Experience                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| **Learner**    | Browse domains → Enroll → Navigate roadmap DAG → Take quizzes → Read AI explanations → Manage spaced-repetition |
| **Instructor** | Monitor cohort → View analytics charts → Resolve flagged events                                                 |
| **Admin**      | Manage users/roles → Domain and ontology management → System stats                                              |

---

## Tech Stack Decisions

| Concern            | Web (React)            | Flutter Mobile                                  | Why                                                                   |
| ------------------ | ---------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Framework          | React 18 + TypeScript  | **Flutter 3.x + Dart**                          | Single codebase for Android + iOS; rich widget library                |
| Navigation         | React Router v6        | **go_router**                                   | Declarative, nested routes, deep-linking, matches web route structure |
| Server state       | TanStack Query v5      | **Riverpod + AsyncNotifier**                    | Fine-grained caching, auto-refresh, loading/error states built-in     |
| Client state       | Zustand (persist)      | **Riverpod + SharedPreferences**                | Auth tokens and settings persisted to device storage                  |
| HTTP               | Axios                  | **Dio**                                         | Interceptors for JWT injection and silent token refresh               |
| Styling            | Tailwind + shadcn/ui   | **Material 3 + custom ThemeData**               | Warm parchment palette, serif typography via Google Fonts             |
| DAG canvas         | React Flow             | **graphview + InteractiveViewer**               | Pinch-to-zoom node graph; tap node to open detail sheet               |
| Charts             | Recharts               | **fl_chart**                                    | Declarative bar/line charts for instructor analytics                  |
| Forms              | React Hook Form        | **flutter_form_builder**                        | Validation, field controllers, error display                          |
| Persistent storage | localStorage (Zustand) | **flutter_secure_storage + shared_preferences** | Tokens in secure storage; preferences in shared_preferences           |
| Notifications      | Browser + Zustand      | **flutter_local_notifications**                 | Local decay reminders and mastery alerts                              |
| Testing            | Vitest + Playwright    | **flutter_test + integration_test**             | Widget tests, golden tests, E2E integration flows                     |

---

## Project Structure

```
flutter_mobile/
├── android/
├── ios/
├── lib/
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart          # Dio instance + interceptors
│   │   │   ├── auth_api.dart
│   │   │   ├── domains_api.dart
│   │   │   ├── enrollments_api.dart
│   │   │   ├── progress_api.dart
│   │   │   ├── quizzes_api.dart
│   │   │   ├── resources_api.dart
│   │   │   ├── explanation_api.dart
│   │   │   ├── notifications_api.dart
│   │   │   ├── decay_api.dart
│   │   │   ├── branching_api.dart
│   │   │   ├── instructor_api.dart
│   │   │   └── admin_api.dart
│   │   ├── models/                      # Dart data classes (mirrors backend shapes)
│   │   │   ├── user.dart
│   │   │   ├── domain.dart
│   │   │   ├── enrollment.dart
│   │   │   ├── roadmap_node.dart
│   │   │   ├── quiz.dart
│   │   │   ├── resource.dart
│   │   │   └── notification.dart
│   │   ├── providers/                   # Riverpod providers
│   │   │   ├── auth_provider.dart
│   │   │   ├── settings_provider.dart
│   │   │   └── my_learning_provider.dart
│   │   ├── router/
│   │   │   └── app_router.dart          # go_router configuration
│   │   ├── theme/
│   │   │   ├── app_theme.dart           # ThemeData: colours, typography, shapes
│   │   │   └── mastery_config.dart      # Mastery-state colours and labels
│   │   └── utils/
│   │       ├── extensions.dart          # BuildContext, String helpers
│   │       └── format.dart             # Date, percent formatting
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── register_screen.dart
│   │   ├── dashboard/
│   │   │   └── dashboard_screen.dart
│   │   ├── catalog/
│   │   │   ├── catalog_screen.dart
│   │   │   ├── domain_detail_screen.dart
│   │   │   └── enroll_bottom_sheet.dart
│   │   ├── roadmap/
│   │   │   ├── roadmap_screen.dart
│   │   │   ├── roadmap_painter.dart     # CustomPainter for edges
│   │   │   └── node_detail_sheet.dart
│   │   ├── learn/
│   │   │   ├── learn_screen.dart
│   │   │   ├── learn_sidebar.dart       # Topic list drawer
│   │   │   └── explanation_panel.dart
│   │   ├── quiz/
│   │   │   ├── quiz_screen.dart
│   │   │   ├── quiz_question_card.dart
│   │   │   └── outcome_screen.dart
│   │   ├── resources/
│   │   │   └── resources_panel.dart
│   │   ├── decay/
│   │   │   └── decay_panel.dart
│   │   ├── notifications/
│   │   │   └── notifications_screen.dart
│   │   ├── branching/
│   │   │   └── branch_selector_sheet.dart
│   │   ├── profile/
│   │   │   └── profile_screen.dart
│   │   ├── settings/
│   │   │   └── settings_screen.dart
│   │   ├── instructor/
│   │   │   ├── learner_list_screen.dart
│   │   │   ├── learner_progress_screen.dart
│   │   │   ├── analytics_screen.dart
│   │   │   └── flagged_events_screen.dart
│   │   └── admin/
│   │       ├── admin_shell.dart
│   │       ├── user_management_screen.dart
│   │       ├── domain_management_screen.dart
│   │       └── system_stats_screen.dart
│   ├── widgets/
│   │   ├── app_shell.dart               # BottomNavigationBar + Scaffold wrapper
│   │   ├── Yeneta_app_bar.dart           # Consistent top app bar
│   │   ├── mastery_badge.dart
│   │   ├── empty_state.dart
│   │   ├── error_widget.dart
│   │   └── loading_shimmer.dart
│   └── main.dart
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
├── pubspec.yaml
├── analysis_options.yaml
└── README.md
```

---

## Screen Map

```
/                    → redirect to /dashboard or /login
/login               → LoginScreen
/register            → RegisterScreen

/dashboard           → DashboardScreen (enrolled domains + decay alerts)
/catalog             → CatalogScreen
/catalog/:slug       → DomainDetailScreen
/enrollments/:id/roadmap  → RoadmapScreen
/enrollments/:id/learn/:nodeId → LearnScreen
/quiz/:nodeId        → QuizScreen (modal fullscreen)
/quiz-attempts/:id   → AttemptReviewScreen

/notifications       → NotificationsScreen
/profile             → ProfileScreen
/settings            → SettingsScreen

/instructor          → InstructorShell (bottom tabs)
/instructor/learners → LearnerListScreen
/instructor/learners/:id → LearnerProgressScreen
/instructor/analytics → AnalyticsScreen
/instructor/flagged  → FlaggedEventsScreen

/admin               → AdminShell
/admin/users         → UserManagementScreen
/admin/domains       → DomainManagementScreen
/admin/stats         → SystemStatsScreen
```

---

## Design System — Matching the Web

The mobile app must visually match the web interface's warm parchment aesthetic.

**Colour palette:**

```dart
static const Color background   = Color(0xFFFAF7F1);  // page bg
static const Color surface      = Color(0xFFF3EFE7);  // card bg
static const Color hover        = Color(0xFFEBE6DB);  // pressed state
static const Color border       = Color(0xFFD6CFBF);  // dividers
static const Color textPrimary  = Color(0xFF1A1614);  // headings
static const Color textBody     = Color(0xFF3A342E);  // body
static const Color textMuted    = Color(0xFF9A9088);  // labels
static const Color accent       = Color(0xFFB85C38);  // oklch(0.62 0.18 28) approx
```

**Typography (Google Fonts):**

- `Cormorant Garamond` — headings (H1, H2, screen titles)
- `Crimson Text` — body, form labels, list items (Crimson Pro equivalent)
- `JetBrains Mono` — monospaced labels, scores, timestamps

**Mastery state colours** (same as web):

```dart
static const Map<MasteryState, Color> masteryColors = {
  MasteryState.notStarted:   Color(0xFF9A9088),
  MasteryState.inProgress:   Color(0xFF4A7FB5),
  MasteryState.mastered:     Color(0xFF3D8B5E),
  MasteryState.reviewNeeded: Color(0xFFB8860B),
  MasteryState.relearn:      Color(0xFFB85C38),
  MasteryState.locked:       Color(0xFFCCC5BC),
};
```

---

## API Integration Pattern

All API calls go through `ApiClient` (Dio instance). A request interceptor injects `Authorization: Bearer <accessToken>`. A response interceptor catches 401s, calls `POST /auth/refresh`, updates stored tokens, and retries the failed request transparently.

Riverpod `AsyncNotifier` providers wrap every remote data fetch with loading/error/data states. Screens never call Dio directly — always through a provider.

---

## Phase Summary

| Phase | Feature                          | Key Deliverable                                                |
| ----- | -------------------------------- | -------------------------------------------------------------- |
| 01    | Scaffold & Design System         | Flutter project, go_router, AppShell, Dio client, theme        |
| 02    | Authentication                   | Login, Register, JWT refresh, secure storage                   |
| 03    | Domain Catalog & Enrollment      | Catalog grid, domain detail, enroll flow, dashboard            |
| 04    | Roadmap Visualisation            | Interactive DAG with mastery-colour nodes, node detail sheet   |
| 05    | Learn & AI Explanation           | Topic list, AI explanation panel, My Learning persistence      |
| 06    | Quiz & Gatekeeper                | MCQ flow, progress bar, timer, outcome screen                  |
| 07    | Resources, Decay & Notifications | Resource tabs, decay panel, notification list                  |
| 08    | Branching, Profile & Settings    | Path selector, profile edit, full settings screen              |
| 09    | Instructor & Admin Panels        | Cohort tables, analytics charts, user/domain management        |
| 10    | Polish, Tests & CI               | Widget tests, integration tests, shimmer, a11y, GitHub Actions |
