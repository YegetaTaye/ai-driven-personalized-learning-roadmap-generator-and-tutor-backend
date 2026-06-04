# Phase 5: Learn Screen & AI Explanation

**Depends on:** [Phase 4: Roadmap Visualisation](04-roadmap.md)  
**Next phase:** [Phase 6: Quiz & Gatekeeper](06-quiz.md)

---

## What to Build

The `LearnScreen` — the full-screen reading experience for a single topic node. Left panel (drawer on mobile) lists all topics in the course outline. Right/main panel shows the AI-generated explanation with streaming text. A "My Learning" persistent list tracks which courses the user has actively studied, surfaced in the app's navigation drawer. This mirrors the web's `LearnPage` + `LearnSidebar` + `LearnContent`.

---

## API Endpoints

| Method | Path                         | Notes                                            |
| ------ | ---------------------------- | ------------------------------------------------ |
| `GET`  | `/nodes/:nodeId/explanation` | AI explanation — may stream; poll until complete |
| `GET`  | `/enrollments/:id/roadmap`   | Reused to get full node list for sidebar         |

---

## Files to Create

```
lib/
├── core/
│   ├── api/
│   │   └── explanation_api.dart
│   ├── models/
│   │   └── explanation.dart          # {summary, keyPoints, commonMistakes, examples}
│   ├── providers/
│   │   ├── explanation_provider.dart
│   │   └── my_learning_provider.dart # Persisted with shared_preferences
└── features/
    └── learn/
        ├── learn_screen.dart
        ├── topic_list_drawer.dart    # Slide-in topic list (equiv. LearnSidebar)
        ├── explanation_panel.dart    # Renders AI content
        └── learn_app_bar.dart       # Top bar with toggle button + quiz CTA
```

---

## Key Implementation Details

### `lib/features/learn/learn_screen.dart`

The screen accepts `enrollmentId` and `nodeId` as route params.

**Layout on phone:**

- `Scaffold` with a custom `LearnAppBar`
- Main body: `ExplanationPanel` (scrollable)
- A floating action button or app bar action to open the `TopicListDrawer` (via `Scaffold.drawer`)
- Bottom action bar: "Take quiz →" button

**Layout on tablet (width ≥ 720px):**

- `Row` with a fixed 260px `TopicListDrawer` always visible + flexible `ExplanationPanel`
- Matches the web's persistent sidebar layout

**State:** Use a `StateProvider<String>` for `activeNodeId` so navigating between topics in the drawer updates the explanation panel without re-mounting the screen.

### `lib/features/learn/topic_list_drawer.dart`

- Header: course name + progress bar (mastered/total)
- `ListView` of `TopicRow` widgets (same grouping logic as web: sections separated by branching points)
- Active node highlighted with dark `AppColors.textPrimary` background + white text
- Locked nodes: 50% opacity, no tap
- Tapping a topic updates `activeNodeId` and closes the drawer (on phone)
- **My Learning section** at top: shown when `myLearningProvider.entries.isNotEmpty`. Lists enrolled courses with their domain names as tappable rows to jump back. Same × remove button on swipe or long-press.

### `lib/features/learn/explanation_panel.dart`

Three states:

**1. Prompt state (not yet requested):**

- Node title (Cormorant Garamond 32px)
- Node description
- Mastery badge + difficulty stars
- Estimated hours + attempts meta
- Learning outcomes bulleted list
- Centre prompt: "Generate AI explanation" filled button

**2. Loading state:**

- `LoadingShimmer` blocks for 3–4 lines of content (skeleton animation)
- Monospaced "generating explanation…" label

**3. Content state:**
Rendered sections (same as web):

- `summary` — Crimson Text 16px, leading 1.6
- `keyPoints` — bulleted list with terracotta bullets
- `commonMistakes` — bordered warning cards
- `examples` (if present) — code-style blocks with JetBrains Mono

### `lib/core/providers/my_learning_provider.dart`

Persisted `StateNotifier` backed by `shared_preferences` (key: `Yeneta_my_learning`).

```dart
class MyLearningEntry {
  final String enrollmentId;
  final String domainName;
  final String domainSlug;
  final String lastNodeId;
  final DateTime lastAccessedAt;
}

class MyLearningNotifier extends StateNotifier<List<MyLearningEntry>> {
  void add(MyLearningEntry entry) { /* upsert */ }
  void updateLastNode(String enrollmentId, String nodeId) { ... }
  void remove(String enrollmentId) { ... }
}
```

**Trigger:** When the user taps "Generate AI explanation", call `myLearningNotifier.add(...)`. On every node navigation, call `updateLastNode(...)`.

### `lib/features/learn/learn_app_bar.dart`

- Back button → pops to roadmap
- Title: node title (truncated)
- Actions: `[topic list icon button]` (phone only), `[Take quiz icon button]`
- "Take quiz" button is grey when node is locked, terracotta when unlocked

---

## Definition of Done

- [ ] `LearnScreen` loads with correct node title and description
- [ ] "Generate AI explanation" button calls the API and renders the content
- [ ] Loading skeleton shows while explanation is being generated
- [ ] Topic list drawer shows all course nodes with mastery state icons
- [ ] Active node is visually highlighted in the topic list
- [ ] Tapping a different topic loads that node's explanation
- [ ] Navigating back to the roadmap still shows updated mastery states
- [ ] After generating an explanation, the course appears in "My Learning" in the drawer
- [ ] "My Learning" entries persist across app restarts (shared_preferences)
- [ ] On tablet: topic list is always visible as a side panel
- [ ] `flutter analyze` zero issues
