# Phase 10: Polish, Tests & CI/CD

**Depends on:** [Phase 9: Instructor & Admin Panels](09-instructor-admin.md)  
**Next phase:** — (final phase)

---

## What to Build

Production-readiness pass: shimmer loading skeletons throughout, comprehensive error states with retry, empty states, accessibility labels, adaptive layouts (phone vs. tablet), widget tests, integration test suite, and a GitHub Actions CI/CD pipeline that builds and tests the Flutter app on every push.

---

## Dependencies to Add

```yaml
dev_dependencies:
  integration_test:
    sdk: flutter
  patrol: ^3.x # Flutter E2E testing (alternative to Espresso/XCUITest)
  golden_toolkit: ^0.x # Golden/screenshot tests
```

---

## Polish Tasks

### Loading Skeletons

Replace all plain `CircularProgressIndicator` usages with `LoadingShimmer` in:

- Catalog grid (shimmer cards in a GridView)
- Roadmap (shimmer node graph placeholder)
- Explanation panel (3–4 shimmer text lines)
- Learner list (shimmer list tiles)
- Stats screen (shimmer stat cards)

`LoadingShimmer` wraps a `Shimmer.fromColors` (from the `shimmer` package) with `AppColors.surface` as base and `AppColors.hover` as highlight.

### Error States

Every `AsyncValue` provider should have a consistent error UI via a shared `YenetaErrorWidget`:

- Error icon (outline) in `AppColors.textMuted`
- Message text in Crimson Text 15px
- "Retry" button that calls `ref.invalidate(provider)`

### Empty States

A shared `EmptyState` widget (icon + title + optional CTA button) used for:

- Catalog: "No domains available yet"
- My Enrollments: "No courses enrolled — browse the catalog"
- Notifications: "You're all caught up"
- Flagged events: "No flagged events"
- Learner list: "No learners enrolled yet"

### Adaptive Layouts

Audit every screen for tablet (width ≥ 720px):

- `AppShell`: switch from `BottomNavigationBar` to `NavigationRail`
- `CatalogScreen`: 3-column grid (vs. 2 on phone)
- `LearnScreen`: persistent `TopicListDrawer` as side panel (vs. modal drawer on phone)
- `RoadmapScreen`: larger node sizes; legend always visible
- `LearnerProgressScreen`: two-column layout (node list | quiz history side by side)

### Accessibility

- All interactive widgets have `Semantics` labels
- Icons in bottom nav have `tooltip` set
- Rating stars have `SemanticsLabel("X out of 5 stars")`
- Focus order correct on all forms (`autofocus`, `FocusNode` traversal)
- Minimum tap target 48×48dp enforced everywhere
- All colours pass 4.5:1 contrast ratio against their background

---

## Testing

### Widget Tests (`test/widget/`)

| File                            | What to Test                                                         |
| ------------------------------- | -------------------------------------------------------------------- |
| `login_screen_test.dart`        | Form validation, error display, submit fires `AuthNotifier.login()`  |
| `domain_card_test.dart`         | Renders domain name, enrolled badge when enrolled                    |
| `quiz_question_card_test.dart`  | Option tap selects answer; already-selected option remains selected  |
| `outcome_screen_test.dart`      | `strong_pass` shows challenge project; `fail_low` shows retry button |
| `mastery_badge_test.dart`       | Correct colour for each MasteryState                                 |
| `toggle_row_test.dart`          | Toggle switches state; callback fires                                |
| `notifications_badge_test.dart` | Shows count when unread > 0; hidden when 0                           |

Use `ProviderScope` overrides to inject mock providers. Mock all API calls — never hit the real network in widget tests.

### Integration Tests (`integration_test/`)

Use `patrol` for E2E flows on a real device/emulator:

| Test                        | Steps                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `auth_flow_test.dart`       | Register → verify on dashboard → logout → login → verify on dashboard                   |
| `enrollment_flow_test.dart` | Login → catalog → enroll in domain → verify appears on dashboard                        |
| `quiz_flow_test.dart`       | Login → roadmap → learn screen → take quiz → submit all answers → verify outcome screen |
| `my_learning_test.dart`     | Generate explanation → verify domain appears in My Learning drawer                      |

### Golden Tests

Use `golden_toolkit` to capture pixel snapshots of:

- `DomainCard` (enrolled / unenrolled states)
- `OutcomeScreen` for `strong_pass` and `fail_severe` tiers
- `MasteryBadge` for all 6 states

---

## CI/CD — GitHub Actions

Add `.github/workflows/flutter.yml`:

```yaml
name: Flutter CI

on:
  push:
    branches: [main]
    paths: ["flutter_mobile/**"]
  pull_request:
    paths: ["flutter_mobile/**"]

jobs:
  analyze-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.x"
          channel: stable
          cache: true
      - working-directory: flutter_mobile
        run: |
          flutter pub get
          flutter analyze
          flutter test --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: flutter_mobile/coverage/lcov.info

  build-android:
    runs-on: ubuntu-latest
    needs: analyze-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.x"
          channel: stable
          cache: true
      - working-directory: flutter_mobile
        run: flutter build apk --release --no-pub

  build-ios:
    runs-on: macos-latest
    needs: analyze-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.x"
          channel: stable
          cache: true
      - working-directory: flutter_mobile
        run: flutter build ios --release --no-codesign --no-pub
```

---

## Definition of Done

- [ ] All screens show shimmer loading states (no raw spinners)
- [ ] All screens have error state with "Retry" button
- [ ] All empty states have descriptive text and CTA
- [ ] Tablet layout tested on 768px emulator — NavigationRail visible, no overflow
- [ ] All interactive elements meet 48dp minimum touch target
- [ ] `flutter analyze` zero issues
- [ ] Widget tests run with `flutter test` — all pass
- [ ] Coverage ≥ 70% on widget and provider logic
- [ ] GitHub Actions pipeline runs on every PR: analyze → test → build (Android + iOS)
- [ ] Build APK and iOS archive succeed without errors
