import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/enrollments_provider.dart';
import '../../core/providers/insights_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/format.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_shimmer.dart';
import 'widgets/activity_heatmap.dart';
import 'widgets/current_state_panel.dart';
import 'widgets/enrollment_insights_card.dart';
import 'widgets/insights_shared.dart';
import 'widgets/profile_card.dart';
import 'widgets/top_achievements_panel.dart';
import 'widgets/velocity_card.dart';
import 'widgets/weak_areas_panel.dart';

class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({required this.enrollmentId, super.key});

  final String enrollmentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightsAsync = ref.watch(insightsProvider(enrollmentId));
    final activityAsync = ref.watch(activityProvider(enrollmentId));
    final statsAsync = ref.watch(insightsProgressStatsProvider(enrollmentId));
    final timelineAsync = ref.watch(timelineEstimateProvider(enrollmentId));
    final enrollmentAsync = ref.watch(enrollmentByIdProvider(enrollmentId));

    final loading = insightsAsync.isLoading || activityAsync.isLoading;
    if (loading) return const LoadingShimmer();

    return insightsAsync.when(
      loading: () => const LoadingShimmer(),
      error: (_, __) => YenetaErrorWidget(
        message: 'Unable to load insights.',
        onRetry: () => _refresh(ref),
      ),
      data: (insights) {
        final domainName =
            enrollmentAsync.valueOrNull?.domainTitle ?? 'Learning Roadmap';
        final enrolledAt = insights.profile.enrolledAt;
        final enrolledLabel =
            '${Format.mediumDate(enrolledAt)} · '
            'enrolled ${Format.timeAgo(enrolledAt)}';

        return RefreshIndicator(
          onRefresh: () async => _refresh(ref),
          child: ColoredBox(
            color: AppColors.background,
            child: ListView(
              padding: EdgeInsets.zero,
              children: <Widget>[
                InsightsPageHeader(
                  eyebrow: 'Learning Intelligence',
                  title: domainName,
                  subtitle: enrolledLabel,
                  action: BackToRoadmapButton(enrollmentId: enrollmentId),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: <Widget>[
                      const InsightsSectionTitle('Where you stand'),
                      CurrentStatePanel(
                        insights: insights,
                        stats: statsAsync.valueOrNull,
                        timeline: timelineAsync.valueOrNull,
                      ),
                      const SizedBox(height: 28),
                      const InsightsSectionTitle('Activity — last 12 months'),
                      activityAsync.when(
                        loading: () => const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        error: (_, __) => const SizedBox.shrink(),
                        data: (days) => ActivityHeatmap(days: days),
                      ),
                      const SizedBox(height: 28),
                      const InsightsSectionTitle('Your learning profile'),
                      ProfileCard(profile: insights.profile),
                      const SizedBox(height: 28),
                      const InsightsSectionTitle('Pace & velocity'),
                      timelineAsync.when(
                        loading: () => const VelocityCard(),
                        error: (_, __) => const VelocityCard(),
                        data: (timeline) => VelocityCard(timeline: timeline),
                      ),
                      if (insights.weakNodes.isNotEmpty ||
                          insights.strugglingNodes.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 28),
                        const InsightsSectionTitle('Needs attention'),
                        WeakAreasPanel(
                          weakNodes: insights.weakNodes,
                          strugglingNodes: insights.strugglingNodes,
                        ),
                      ],
                      if (insights.topNodes.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 28),
                        const InsightsSectionTitle('Top achievements'),
                        TopAchievementsPanel(topNodes: insights.topNodes),
                      ],
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

  void _refresh(WidgetRef ref) {
    ref
      ..invalidate(insightsProvider(enrollmentId))
      ..invalidate(activityProvider(enrollmentId))
      ..invalidate(insightsProgressStatsProvider(enrollmentId))
      ..invalidate(timelineEstimateProvider(enrollmentId));
  }
}
