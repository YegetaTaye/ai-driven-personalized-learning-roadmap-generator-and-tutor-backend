import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/gamification_models.dart';
import '../../core/providers/gamification_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_shimmer.dart';
import 'widgets/badge_grid.dart';
import 'widgets/gamification_shared.dart';
import 'widgets/streak_badge.dart';
import 'widgets/weekly_goal_card.dart';
import 'widgets/xp_bar.dart';
import 'widgets/xp_events_list.dart';

class AchievementsScreen extends ConsumerWidget {
  const AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gamificationAsync = ref.watch(gamificationProvider);

    return gamificationAsync.when(
      loading: () => const LoadingShimmer(),
      error: (_, __) => YenetaErrorWidget(
        message: 'Could not load achievements. Try refreshing.',
        onRetry: () => ref.invalidate(gamificationProvider),
      ),
      data: (data) {
        final earnedCount = data.badges.earned.length;

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(gamificationProvider),
          child: ColoredBox(
            color: AppColors.background,
            child: ListView(
              padding: EdgeInsets.zero,
              children: <Widget>[
                GamificationPageHeader(
                  subtitle:
                      'Level ${data.xp.level} · '
                      '${data.xp.total} XP · '
                      '$earnedCount badge${earnedCount == 1 ? '' : 's'} earned · '
                      '${data.streak.current}-day streak',
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: <Widget>[
                      _XpStreakRow(
                        xp: data.xp,
                        streak: data.streak.current,
                      ),
                      const SizedBox(height: 28),
                      GamificationSection(
                        icon: Icons.track_changes_outlined,
                        title: 'Weekly Goal',
                        child: WeeklyGoalCard(goal: data.weeklyGoal),
                      ),
                      const SizedBox(height: 28),
                      GamificationSection(
                        icon: Icons.emoji_events_outlined,
                        title: 'Badges',
                        child: BadgeGrid(badges: data.badges.all),
                      ),
                      const SizedBox(height: 28),
                      GamificationSection(
                        icon: Icons.history,
                        title: 'Recent XP',
                        child: XpEventsList(events: data.recentXpEvents),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _XpStreakRow extends StatelessWidget {
  const _XpStreakRow({
    required this.xp,
    required this.streak,
  });

  final XpInfo xp;
  final int streak;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final sideBySide = constraints.maxWidth >= 560;

        if (sideBySide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                flex: 2,
                child: GamificationCard(child: XpBar(xp: xp)),
              ),
              const SizedBox(width: 12),
              Expanded(child: StreakBadge(current: streak)),
            ],
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            GamificationCard(child: XpBar(xp: xp)),
            const SizedBox(height: 12),
            StreakBadge(current: streak),
          ],
        );
      },
    );
  }
}
