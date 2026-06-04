# Phase 8: Branching, Profile & Settings

**Depends on:** [Phase 7: Resources, Decay & Notifications](07-resources-decay-notifications.md)  
**Next phase:** [Phase 9: Instructor & Admin Panels](09-instructor-admin.md)

---

## What to Build

Three features that complete the learner's personal experience:

1. **Path Branching** — UI to select or change a learning path at branching points in the roadmap
2. **Profile** — view and edit full name, avatar URL, preferred language
3. **Settings** — password change, learning defaults, notification preferences, danger zone (mirrors the web Settings page)

---

## API Endpoints

| Method   | Path                        | Notes                                         |
| -------- | --------------------------- | --------------------------------------------- |
| `GET`    | `/enrollments/:id/branches` | Available branch paths for an enrollment      |
| `POST`   | `/enrollments/:id/branch`   | `{branchPath}` — select/change branch         |
| `GET`    | `/users/me`                 | Current user                                  |
| `PATCH`  | `/users/me`                 | `{fullName?, avatarUrl?, preferredLanguage?}` |
| `POST`   | `/users/me/change-password` | `{currentPassword, newPassword}` → 204        |
| `DELETE` | `/users/me`                 | Delete account → 204                          |

---

## Files to Create

```
lib/
├── core/
│   ├── api/
│   │   └── branching_api.dart
│   └── providers/
│       └── settings_provider.dart     # Persisted: learningDefaults, notificationPrefs
├── features/
│   ├── branching/
│   │   └── branch_selector_sheet.dart
│   ├── profile/
│   │   └── profile_screen.dart
│   └── settings/
│       ├── settings_screen.dart
│       ├── sections/
│       │   ├── security_section.dart
│       │   ├── learning_defaults_section.dart
│       │   ├── notification_prefs_section.dart
│       │   └── danger_zone_section.dart
│       └── widgets/
│           └── toggle_row.dart         # Custom pill toggle widget
```

---

## Key Implementation Details

### Branch Selector Sheet

A `showModalBottomSheet` triggered from `RoadmapScreen` when the user is at a branching node and no path is selected (or they want to change).

- Title: "Choose your learning path"
- A `RadioListTile` group for each available `BranchPath`: Frontend / Backend / Data Science
- Brief description of each path (hardcoded or from API)
- Current selection highlighted
- "Confirm" button → calls `POST /enrollments/:id/branch`, invalidates roadmap provider, closes sheet
- Roadmap re-renders filtered by the selected branch

### Profile Screen (`/profile`)

Mirrors the web ProfilePage account section only (per-enrollment preferences live in the enroll sheet):

- Avatar: `CircleAvatar` with `CachedNetworkImage`; tapping opens edit flow
- Full name: `TextFormField`, editable inline
- Email: read-only display (JetBrains Mono)
- Preferred language: `DropdownButtonFormField` (ISO 639-1 codes)
- "Save changes" button → `PATCH /users/me`
- Success: `SnackBar` "Profile updated"

### Settings Screen (`/settings`)

Four card sections (same as web Settings page):

**Security:**

- Three `TextFormField` inputs: Current password, New password, Confirm password
- Inline validation (min 8 chars, passwords match)
- "Update password" button → `POST /users/me/change-password`

**Learning defaults:**

- "Weekly hours goal": `Slider` (range 1–40) + numeric label
- "Familiarity level": `SegmentedButton` (Beginner / Intermediate / Advanced)
- "Learning goal": `Wrap` of `ChoiceChip` (Get a job / Upskill / Hobby / Certification)
- Auto-saves to `SettingsProvider` on change (no Save button); pre-fills `EnrollBottomSheet`

**Notification preferences:**
Three `ToggleRow` widgets (custom pill toggle):

- Decay reminders
- Quiz result notifications
- Mastery achievements

`ToggleRow` widget: a `Row` with label on left, `GestureDetector`-wrapped animated pill on right. When on: `AppColors.accent` background, white circle right; when off: `AppColors.border` background, circle left. `AnimatedContainer` for smooth 150ms transition. Saves to `SettingsProvider` immediately.

**Danger zone:**
Card with `AppColors.accentLight` tinted background:

- "Clear My Learning history" — outlined button; tapping shows an `AlertDialog` confirmation; on confirm calls `myLearningNotifier.clear()`
- "Delete account" — filled `AppColors.accent` button; tapping opens `AlertDialog` with:
  - Warning copy
  - `TextFormField` "Type your email to confirm"
  - Confirm button enabled only when typed value matches `authState.user!.email`
  - On confirm: `DELETE /users/me` → `authNotifier.logout()` → navigate to `/login`

### `lib/core/providers/settings_provider.dart`

```dart
class LearningDefaults {
  final int? weeklyHours;
  final FamiliarityLevel? familiarityLevel;
  final LearningGoal? learningGoal;
}

class NotificationPrefs {
  final bool decayReminders;       // default true
  final bool quizResults;          // default true
  final bool masteryAchievements;  // default true
}

class SettingsNotifier extends StateNotifier<SettingsState> {
  // Persisted with shared_preferences key 'Yeneta_settings'
  void setLearningDefaults(LearningDefaults defaults) { ... }
  void setNotificationPrefs(NotificationPrefs prefs) { ... }
}
```

---

## Definition of Done

- [ ] Branch selector sheet opens at branching points; selecting a path re-renders the roadmap filtered by branch
- [ ] Profile screen loads current user data and saves changes to API
- [ ] Change password: success shows snackbar; wrong current password shows inline error
- [ ] Learning defaults auto-save and pre-fill the enrollment bottom sheet
- [ ] Notification preference toggles animate smoothly and persist across restarts
- [ ] "Clear My Learning" removes all entries after confirmation
- [ ] "Delete account" requires email confirmation, deletes account, and logs out
- [ ] Settings persist across app restarts via shared_preferences
- [ ] `flutter analyze` zero issues
