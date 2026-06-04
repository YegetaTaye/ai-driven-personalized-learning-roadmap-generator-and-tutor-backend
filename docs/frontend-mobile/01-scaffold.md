# Phase 1: Scaffold, Navigation & Design System

**Depends on:** Backend running (all services healthy)  
**Next phase:** [Phase 2: Authentication](02-auth.md)

---

## What to Build

Bootstrap the Flutter project. Install all core dependencies. Configure go_router with nested navigation. Build the persistent AppShell (bottom navigation bar + drawer for tablet/desktop). Wire up Riverpod. Set up the Dio API client skeleton. Define the complete design system in `AppTheme`. No real API calls yet — scaffolding and visual foundation only.

---

## Dependencies (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Navigation
  go_router: ^14.x

  # State management & DI
  flutter_riverpod: ^2.x
  riverpod_annotation: ^2.x

  # HTTP
  dio: ^5.x

  # Storage
  flutter_secure_storage: ^9.x
  shared_preferences: ^2.x

  # Typography
  google_fonts: ^6.x

  # UI utilities
  shimmer: ^3.x # Loading skeleton effect
  cached_network_image: ^3.x # Avatar / domain icon caching

  # Icons
  lucide_icons: ^1.x # Matches web Lucide icon set

dev_dependencies:
  flutter_test:
    sdk: flutter
  riverpod_generator: ^2.x
  build_runner: ^2.x
  flutter_lints: ^4.x
  mockito: ^5.x
```

---

## File & Folder Structure

```
flutter_mobile/lib/
├── core/
│   ├── api/
│   │   └── api_client.dart          # Dio instance (interceptors in Phase 2)
│   ├── models/                      # Empty — filled per phase
│   ├── providers/
│   │   └── auth_provider.dart       # AuthNotifier skeleton
│   ├── router/
│   │   └── app_router.dart          # go_router with redirect logic
│   ├── theme/
│   │   ├── app_theme.dart           # Full ThemeData
│   │   ├── app_colors.dart          # Colour constants
│   │   ├── app_text_styles.dart     # Named TextStyle presets
│   │   └── mastery_config.dart      # MasteryState → Color/label
│   └── utils/
│       ├── extensions.dart
│       └── format.dart
├── features/
│   ├── auth/                        # Empty — Phase 2
│   ├── dashboard/
│   │   └── dashboard_screen.dart    # Placeholder: "Your dashboard"
│   └── (all other features empty)
├── widgets/
│   ├── app_shell.dart               # BottomNavigationBar scaffold
│   ├── Yeneta_app_bar.dart
│   ├── empty_state.dart
│   └── loading_shimmer.dart
└── main.dart
```

---

## Key Implementation Details

### `lib/core/theme/app_colors.dart`

```dart
class AppColors {
  static const Color background   = Color(0xFFFAF7F1);
  static const Color surface      = Color(0xFFF3EFE7);
  static const Color hover        = Color(0xFFEBE6DB);
  static const Color border       = Color(0xFFD6CFBF);
  static const Color textPrimary  = Color(0xFF1A1614);
  static const Color textBody     = Color(0xFF3A342E);
  static const Color textSubtle   = Color(0xFF6E645A);
  static const Color textMuted    = Color(0xFF9A9088);
  static const Color accent       = Color(0xFFB85C38);  // terracotta
  static const Color accentLight  = Color(0x1AB85C38);  // 10% accent
}
```

### `lib/core/theme/app_theme.dart`

Use `GoogleFonts.cormorantGaramondTextTheme()` as the base, overlaying `Crimson Text` for body and `JetBrains Mono` for labels. Set `scaffoldBackgroundColor` to `AppColors.background`. Cards use `surface` with a `border` outline — no elevation shadows (matches flat web design).

```dart
static ThemeData build() => ThemeData(
  colorScheme: ColorScheme.light(
    surface: AppColors.surface,
    primary: AppColors.accent,
    onPrimary: Colors.white,
    outline: AppColors.border,
  ),
  scaffoldBackgroundColor: AppColors.background,
  appBarTheme: AppBarTheme(
    backgroundColor: AppColors.background,
    elevation: 0,
    iconTheme: IconThemeData(color: AppColors.textBody),
    titleTextStyle: GoogleFonts.cormorantGaramond(
      fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.textPrimary,
    ),
  ),
  dividerColor: AppColors.border,
  cardTheme: CardTheme(
    color: AppColors.surface,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: BorderSide(color: AppColors.border),
    ),
  ),
  ...
);
```

### `lib/core/theme/mastery_config.dart`

```dart
enum MasteryState { notStarted, inProgress, mastered, reviewNeeded, relearn, locked }

class MasteryConfig {
  static const Map<MasteryState, Color>  colors = { ... };
  static const Map<MasteryState, String> labels = { ... };
  static const Map<MasteryState, String> icons  = {
    MasteryState.mastered:     '✓',
    MasteryState.inProgress:   '◑',
    MasteryState.reviewNeeded: '↻',
    MasteryState.notStarted:   '○',
    MasteryState.relearn:      '⚠',
    MasteryState.locked:       '🔒',
  };
}
```

### `lib/core/api/api_client.dart`

```dart
class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,  // from env/flavor config
      headers: {'Content-Type': 'application/json'},
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
    ));
    // Interceptors added in Phase 2
  }

  Dio get dio => _dio;
}

final apiClientProvider = Provider((ref) => ApiClient());
```

### `lib/core/router/app_router.dart`

Use `GoRouter` with a `redirect` callback that checks `AuthNotifier` state. Unauthenticated users are always redirected to `/login`. Role checks redirect instructors/admins to their dashboards.

```dart
final appRouterProvider = Provider((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isLoggedIn = authState.user != null;
      final isLoginRoute = state.matchedLocation == '/login' ||
                           state.matchedLocation == '/register';

      if (!isLoggedIn && !isLoginRoute) return '/login';
      if (isLoggedIn && isLoginRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
          // ... added per phase
        ],
      ),
    ],
  );
});
```

### `lib/widgets/app_shell.dart`

- `Scaffold` with `BottomNavigationBar` for 4 core items: Dashboard, Catalog, Notifications, Profile
- Conditionally add an Instructor or Admin tab based on user role
- On tablet (`width >= 720`), show a `NavigationRail` (left sidebar) instead of bottom bar — mirrors the web's sidebar
- Use `ShellRoute`'s `child` parameter as the page body

---

## Definition of Done

- [ ] `flutter run` starts on emulator/simulator with no errors
- [ ] AppShell renders with bottom nav (Dashboard, Catalog, Notifications, Profile)
- [ ] go_router navigates between `/dashboard` and `/login` without full restart
- [ ] `/dashboard` (and all routes) redirect to `/login` when no auth token
- [ ] `AppTheme.build()` applied: warm parchment background, Cormorant Garamond headings
- [ ] Mastery colours defined and accessible via `MasteryConfig`
- [ ] `flutter analyze` reports zero issues
- [ ] DashboardScreen shows placeholder text in the correct typography
