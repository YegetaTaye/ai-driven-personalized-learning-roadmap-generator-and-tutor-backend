# Phase 4: Roadmap Visualisation

**Depends on:** [Phase 3: Domain Catalog & Enrollment](03-catalog.md)  
**Next phase:** [Phase 5: Learn & AI Explanation](05-learn-explanation.md)

---

## What to Build

The core learning experience: an interactive DAG (directed acyclic graph) showing all learning nodes colour-coded by mastery state. Since React Flow is web-only, the mobile version uses `graphview` (or `flutter_graph_view`) for automatic layout, wrapped in `InteractiveViewer` for pinch-to-zoom and pan. Tapping a node opens a `NodeDetailSheet` (bottom sheet) with the node's full details and CTAs.

---

## Dependencies to Add

```yaml
dependencies:
  graphview: ^1.x # Automatic DAG layout (Sugiyama/Buchheim algorithms)
```

---

## API Endpoints

| Method | Path                        | Notes                                         |
| ------ | --------------------------- | --------------------------------------------- |
| `GET`  | `/enrollments/:id/roadmap`  | Returns `{nodes, edges, selectedBranchPath}`  |
| `GET`  | `/enrollments/:id/progress` | Progress stats (mastered count, completion %) |

---

## Files to Create

```
lib/
├── core/
│   ├── api/
│   │   └── progress_api.dart
│   ├── models/
│   │   ├── roadmap_node.dart         # RoadmapNode with masteryState, unlocked, etc.
│   │   └── roadmap_edge.dart
│   └── providers/
│       └── roadmap_provider.dart
├── features/
│   └── roadmap/
│       ├── roadmap_screen.dart
│       ├── node_widget.dart           # Individual node widget for the graph
│       ├── node_detail_sheet.dart     # Bottom sheet shown on node tap
│       └── progress_stats_bar.dart   # Header bar with completion progress
```

---

## Key Implementation Details

### `lib/features/roadmap/roadmap_screen.dart`

**Layout:**

- `Scaffold` with `YenetaAppBar` showing domain name
- A `progress_stats_bar` as a `SliverPersistentHeader` at the top
- `InteractiveViewer` filling the rest of the screen (pan + pinch-to-zoom, `minScale: 0.3`, `maxScale: 2.5`)
- Inside `InteractiveViewer`: `GraphView` widget from the `graphview` package using `SugiyamaConfiguration` (top-to-bottom hierarchical layout matching the web)

**Node widget (`node_widget.dart`):**

- `Container` with `borderRadius: 10`, border matching mastery colour, background as 10% tint of mastery colour
- Node title in Crimson Text (truncated)
- Mastery state icon (`MasteryConfig.icons[state]`) in top-right corner
- Locked nodes: reduced opacity, no tap response
- Active/tapped node: stronger border, slight scale-up via `AnimatedContainer`

**Edge rendering:**
`graphview` draws edges automatically. Override the default paint with a `CustomEdgeRenderer` that draws `oklch`-equivalent grey curves matching the web's edge style.

### `lib/features/roadmap/node_detail_sheet.dart`

A `showModalBottomSheet` with `isScrollControlled: true` and `DraggableScrollableSheet`.

Sheet content (same information as the web node detail drawer):

- Node title (Cormorant Garamond 28px)
- Mastery state badge
- Difficulty stars (1–3)
- Estimated hours
- Learning outcomes list
- Attempts count + best quiz score

**Action buttons at bottom:**

- "Learn this topic →" (primary filled) → navigate to `/enrollments/:id/learn/:nodeId`
- "Take quiz →" (secondary outlined) — enabled only if node is unlocked
- "Resources" (ghost) → navigate to resources panel

### `lib/features/roadmap/progress_stats_bar.dart`

Compact header bar (height ~52px):

- Linear progress indicator (mastered / total) with terracotta colour
- `"X / Y mastered"` text in JetBrains Mono
- Completion percentage

### Mastery-colour legend

A floating `Legend` widget (bottom-right, collapsed by default, tap to expand) showing all mastery states with their colours — helpful for first-time users.

### `lib/core/providers/roadmap_provider.dart`

```dart
@riverpod
Future<RoadmapData> roadmap(RoadmapRef ref, String enrollmentId) async {
  final api = ref.read(progressApiProvider);
  return api.getRoadmap(enrollmentId);
}
```

After quiz completion (Phase 6) or decay review (Phase 7), call `ref.invalidate(roadmapProvider(enrollmentId))` to refresh mastery states.

---

## Definition of Done

- [ ] Roadmap loads and renders the full DAG with correct node positions
- [ ] Nodes are colour-coded by mastery state
- [ ] Locked nodes are visually dimmed and not tappable
- [ ] Tapping a node opens the node detail bottom sheet
- [ ] Bottom sheet shows all node metadata and action buttons
- [ ] "Learn this topic" navigates to `/enrollments/:id/learn/:nodeId`
- [ ] Progress bar at top reflects current mastered/total counts
- [ ] InteractiveViewer: pinch to zoom in/out, pan around the graph
- [ ] Graph re-centres on the first unlocked node on load
- [ ] `flutter analyze` zero issues
