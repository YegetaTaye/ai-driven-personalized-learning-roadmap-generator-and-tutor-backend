import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/auth_provider.dart';
import '../../core/providers/decay_provider.dart';
import '../../core/providers/enrollment_with_stats_provider.dart';
import '../../core/providers/my_learning_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_shimmer.dart';
import '../decay/decay_panel.dart';
import 'enrolled_domain_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enrollmentsAsync = ref.watch(enrollmentsWithStatsProvider);
    final myLearning = ref.watch(myLearningProvider).valueOrNull;
    final firstName = ref.watch(authProvider).valueOrNull?.user?.fullName
        .split(' ')
        .first;

    return enrollmentsAsync.when(
      loading: () => const LoadingShimmer(),
      error: (_, __) => YenetaErrorWidget(
        message: 'Unable to load your enrollments.',
        onRetry: () => ref.invalidate(enrollmentsWithStatsProvider),
      ),
      data: (enrollmentsWithStats) {
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: <Widget>[
            Text(
              firstName != null && firstName.isNotEmpty
                  ? 'Welcome back, $firstName.'
                  : 'Welcome back.',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 32,
                    height: 1.15,
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 6),
            Text(
              'Pick up where you left off or explore a new domain.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 15,
                    color: AppColors.textBody,
                  ),
            ),
            const SizedBox(height: 28),

            // My Enrollments
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    'My Enrollments',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontSize: 20,
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => context.go('/catalog'),
                  icon: Icon(Icons.add, size: 16, color: AppColors.accent),
                  label: Text(
                    'Explore more',
                    style: TextStyle(color: AppColors.accent, fontSize: 14),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (enrollmentsWithStats.isEmpty)
              const DashboardEmptyState()
            else
              ...enrollmentsWithStats.map((enrollment) {
                final currentNodeId =
                    myLearning?.enrollmentToNode[enrollment.id];

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: EnrolledDomainCard(
                    enrollment: enrollment,
                    onTap: () {
                      if (currentNodeId != null && currentNodeId.isNotEmpty) {
                        context.go(
                          '/enrollments/${enrollment.id}/learn/$currentNodeId',
                        );
                      } else {
                        context.go('/enrollments/${enrollment.id}/roadmap');
                      }
                    },
                  ),
                );
              }),

            if (enrollmentsWithStats.isNotEmpty) ...<Widget>[
              const SizedBox(height: 20),
              Text(
                'Review Reminders',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 20,
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 12),
              ...enrollmentsWithStats.map(
                (enrollment) => DecayPanel(enrollmentId: enrollment.id),
              ),
              _ReviewRemindersFallback(
                enrollmentIds:
                    enrollmentsWithStats.map((e) => e.id).toList(),
              ),
            ],
          ],
        );
      },
    );
  }
}

/// Shown when no enrollment has decay alerts (all panels hidden).
class _ReviewRemindersFallback extends ConsumerWidget {
  const _ReviewRemindersFallback({required this.enrollmentIds});

  final List<String> enrollmentIds;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var anyLoading = false;
    var anyHasAlerts = false;

    for (final id in enrollmentIds) {
      final async = ref.watch(decayStatusProvider(id));
      if (async.isLoading) {
        anyLoading = true;
      }
      if (async.hasValue && async.value!.nodes.isNotEmpty) {
        anyHasAlerts = true;
      }
    }

    if (anyLoading || anyHasAlerts) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: <Widget>[
          Icon(Icons.check_circle_outline, color: AppColors.textMuted),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'All caught up — no topics need review right now.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textBody,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
