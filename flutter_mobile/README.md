# Yeneta Flutter Mobile

Phase 0 scaffold for the Yeneta adaptive learning mobile app.

## Stack

- Flutter 3.x + Dart
- Riverpod for state and dependency injection
- go_router for declarative routing
- Dio for REST API integration with JWT refresh pattern
- Material 3 + custom parchment design system

## API base URL

- Android emulator: `http://10.0.2.2:8080/api/v1`
- iOS simulator: `http://localhost:8080/api/v1`
- Physical device: `http://<machine-LAN-IP>:8080/api/v1`

Override at runtime:

```bash
flutter run --dart-define=Yeneta_API_BASE_URL=http://localhost:8080/api/v1
```

## Current scope

- Full project directory structure from `docs/frontend-mobile/00-overview.md`
- Route map and guarded navigation for learner/instructor/admin roles
- Theme system with warm parchment palette and required typography
- Core providers and API service skeletons
- Placeholder screens wired for all planned routes

## Next steps

1. Run `flutter create .` inside `flutter_mobile/` to generate native platform runner files.
2. Run `flutter pub get`.
3. Start Phase 2 implementation from `docs/frontend-mobile/02-auth.md`.
