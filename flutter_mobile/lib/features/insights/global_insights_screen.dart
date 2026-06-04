import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/insights_models.dart';
import '../../core/providers/insights_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_shimmer.dart';
import 'widgets/activity_heatmap.dart';
import 'widgets/enrollment_insights_card.dart';
import 'widgets/insights_shared.dart';
import 'widgets/top_achievements_panel.dart';
import 'widgets/weak_areas_panel.dart';

class GlobalInsightsScreen extends ConsumerWidget {
  const GlobalInsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightsAsync = ref.watch(globalInsightsProvider);
    final activityAsync = ref.watch(globalActivityProvider);

    final loading = insightsAsync.isLoading || activityAsync.isLoading;
    if (loading) return const LoadingShimmer();

    return insightsAsync.when(
      loading: () => const LoadingShimmer(),
      error: (_, __) => YenetaErrorWidget(
        message: 'Unable to load insights.',
        onRetry: () => _refresh(ref),
      ),
      data: (insights) {
        final stats = insights.overallStats;

        return RefreshIndicator(
          onRefresh: () async => _refresh(ref),
          child: ColoredBox(
            color: AppColors.background,
            child: ListView(
              padding: EdgeInsets.zero,
              children: <Widget>[
                InsightsPageHeader(
                  eyebrow: 'Account Overview',
                  title: 'Your Learning Insights',
                  subtitle:
                      '${insights.totalEnrollments} enrolled course'
                      '${insights.totalEnrollments == 1 ? '' : 's'} · '
                      '${stats.masteredNodes} nodes mastered overall',
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: <Widget>[
                      const InsightsSectionTitle('Overall progress'),
                      _OverallStatsGrid(
                        stats: stats,
                        streak: insights.streakSummary.currentStreak,
                      ),
                      const SizedBox(height: 12),
                      InsightsMomentumBanner(
                        momentum: insights.momentum,
                        compact: true,
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
                      if (insights.enrollmentBreakdowns.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 28),
                        const InsightsSectionTitle('Courses'),
                        ...insights.enrollmentBreakdowns.map((breakdown) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: EnrollmentInsightsCard(
                              breakdown: breakdown,
                              onTap: () => context.push(
                                '/enrollments/${breakdown.enrollmentId}/insights',
                              ),
                            ),
                          );
                        }),
                      ],
                      const SizedBox(height: 28),
                      const InsightsSectionTitle('Knowledge gaps'),
                      GlobalWeakNodesPanel(
                        nodes: insights.globalWeakNodes,
                        onTap: (node) => context.push(
                          '/enrollments/${node.enrollmentId}/roadmap',
                        ),
                      ),
                      if (insights.globalTopNodes.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 28),
                        const InsightsSectionTitle('Top achievements'),
                        GlobalTopAchievementsPanel(
                          topNodes: insights.globalTopNodes,
                        ),
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
      ..invalidate(globalInsightsProvider)
      ..invalidate(globalActivityProvider);
  }
}

class _OverallStatsGrid extends StatelessWidget {
  const _OverallStatsGrid({
    required this.stats,
    required this.streak,
  });

  final OverallStats stats;
  final int streak;

  @override
  Widget build(BuildContext context) {
    return InsightsStatGrid(
      children: <Widget>[
        InsightsStatBox(
          value: '${stats.completionPercent.round()}%',
          label: 'Avg completion',
        ),
        InsightsStatBox(
          value: '${stats.masteredNodes}',
          label: 'Nodes mastered',
        ),
        InsightsStatBox(
          value: stats.avgScore != null ? '${stats.avgScore!.round()}%' : '—',
          label: 'Avg quiz score',
          accent: const Color(0xFF5A9B6A),
        ),
        InsightsStatBox(
          value: '$streak',
          label: 'Day streak',
          accent: streak >= 7 ? AppColors.accent : const Color(0xFF6E645A),
        ),
      ],
    );
  }
}
