import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/models/user.dart';
import '../core/theme/app_colors.dart';
import 'Yeneta_app_bar.dart';

class AppShell extends StatelessWidget {
  const AppShell({required this.child, required this.userRole, super.key});

  final Widget child;
  final UserRole? userRole;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final destinations = _destinationsForRole(userRole);
    final selectedIndex = _selectedIndex(destinations, location);
    final title = _titleForLocation(location);
    final showShellAppBar = !_supportsCustomSliverAppBar(location);

    final scaffold = MediaQuery.sizeOf(context).width >= 720
        ? Scaffold(
            appBar: showShellAppBar ? YenetaAppBar(title: title) : null,
            body: Row(
              children: <Widget>[
                NavigationRail(
                  selectedIndex: selectedIndex,
                  labelType: NavigationRailLabelType.all,
                  backgroundColor: AppColors.surface,
                  onDestinationSelected: (index) {
                    context.go(destinations[index].path);
                  },
                  destinations: destinations
                      .map(
                        (item) => NavigationRailDestination(
                          icon: Icon(item.icon),
                          label: Text(item.label),
                        ),
                      )
                      .toList(),
                ),
                const VerticalDivider(width: 1),
                Expanded(child: child),
              ],
            ),
          )
        : Scaffold(
            appBar: showShellAppBar
                ? YenetaAppBar(
                    title: title,
                    actions: _buildActions(context, location),
                  )
                : null,
            body: child,
            bottomNavigationBar: BottomNavigationBar(
              currentIndex: selectedIndex,
              onTap: (index) => context.go(destinations[index].path),
              items: destinations
                  .map(
                    (item) => BottomNavigationBarItem(
                      icon: Icon(item.icon),
                      label: item.label,
                    ),
                  )
                  .toList(),
            ),
          );

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) context.go('/dashboard');
      },
      child: scaffold,
    );
  }

  List<_ShellDestination> _destinationsForRole(UserRole? role) {
    final base = <_ShellDestination>[
      const _ShellDestination(
        label: 'Dashboard',
        path: '/dashboard',
        icon: Icons.dashboard_outlined,
      ),
      const _ShellDestination(
        label: 'Catalog',
        path: '/catalog',
        icon: Icons.grid_view_rounded,
      ),
      const _ShellDestination(
        label: 'Insights',
        path: '/insights',
        icon: Icons.insights_outlined,
      ),
      const _ShellDestination(
        label: 'Achievements',
        path: '/achievements',
        icon: Icons.emoji_events_outlined,
      ),
    ];

    if (role == UserRole.instructor) {
      return <_ShellDestination>[
        ...base,
        const _ShellDestination(
          label: 'Instructor',
          path: '/instructor',
          icon: Icons.school_outlined,
        ),
      ];
    }

    // Note: Admin accounts are blocked from mobile app
    // Admin dashboard is only accessible from web

    return base;
  }

  int _selectedIndex(List<_ShellDestination> destinations, String location) {
    final index = destinations.indexWhere(
      (item) => location == item.path || location.startsWith('${item.path}/'),
    );

    return index < 0 ? 0 : index;
  }

  List<Widget>? _buildActions(BuildContext context, String location) {
    // Only show profile/notifications icons on dashboard
    if (location == '/dashboard') {
      return [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () => context.go('/notifications'),
        ),
        IconButton(
          icon: const Icon(Icons.person_outline),
          onPressed: () => context.go('/profile'),
        ),
      ];
    }
    return null;
  }

  String _titleForLocation(String location) {
    if (location.startsWith('/catalog/')) return 'Domain Detail';
    if (location.startsWith('/enrollments/') && location.contains('/roadmap')) {
      return 'Roadmap';
    }
    if (location.startsWith('/enrollments/') && location.contains('/learn/')) {
      return 'Learn';
    }
    if (location.startsWith('/quiz-attempts/')) return 'Attempt Review';
    if (location.startsWith('/quiz/')) return 'Quiz';
    if (location.startsWith('/instructor/learners/')) return 'Learner Progress';
    if (location.startsWith('/instructor/analytics')) {
      return 'Instructor Analytics';
    }
    if (location.startsWith('/instructor/flagged')) return 'Flagged Events';
    if (location.startsWith('/instructor')) return 'Instructor';
    // Note: Admin routes removed - admin dashboard is web-only
    if (location == '/catalog') return 'Catalog';
    if (location == '/insights') return 'Insights';
    if (location.contains('/insights')) return 'Insights';
    if (location == '/achievements') return 'Achievements';
    if (location == '/notifications') return 'Notifications';
    if (location == '/profile') return 'Profile';
    if (location == '/settings') return 'Settings';
    if (location == '/dashboard') return 'Dashboard';
    return '';
  }

  bool _supportsCustomSliverAppBar(String location) {
    if (location.startsWith('/catalog/')) {
      return true;
    }
    if (location.startsWith('/enrollments/') && location.contains('/roadmap')) {
      return true;
    }
    if (location.startsWith('/enrollments/') && location.contains('/learn/')) {
      return true;
    }
    if (location == '/notifications') {
      return true;
    }
    return false;
  }
}

class _ShellDestination {
  const _ShellDestination({
    required this.label,
    required this.path,
    required this.icon,
  });

  final String label;
  final String path;
  final IconData icon;
}
