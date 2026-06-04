import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/auth_provider.dart';
import '../../core/providers/decay_provider.dart';
import '../../core/providers/enrollment_with_stats_provider.dart';
import '../../core/providers/my_learning_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/providers/subscription_provider.dart';
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
            const SizedBox(height: 20),

            // Subscription / Credits
            _SubscriptionBanner(),
            const SizedBox(height: 20),

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

class _SubscriptionBanner extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final creditAsync = ref.watch(creditStatusProvider);

    return creditAsync.when(
      loading: () => const SizedBox(height: 20),
      error: (_, __) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
          color: AppColors.surface,
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline_rounded, size: 16, color: AppColors.textMuted),
            const SizedBox(width: 10),
            Expanded(
              child: Text('Subscription', style: Theme.of(context).textTheme.bodySmall),
            ),
            TextButton(
              onPressed: () => context.push('/subscription'),
              child: const Text('Details'),
            ),
          ],
        ),
      ),
      data: (status) {
        if (status.isPro || status.unlimited) {
          return Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFB8860B).withValues(alpha: 0.3)),
              color: const Color(0xFFB8860B).withValues(alpha: 0.04),
            ),
            child: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFB8860B).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(Icons.auto_awesome_rounded, size: 18, color: Color(0xFFB8860B)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Scholar Plan',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600, fontSize: 15,
                        )),
                      Text('Unlimited AI access',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textMuted, fontSize: 12,
                        )),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => context.push('/subscription'),
                  child: const Text('Manage'),
                ),
              ],
            ),
          );
        }

        final remaining = status.creditsRemaining ?? 0;
        final low = remaining <= 8;
        final pct = ((remaining / 30) * 100).round().clamp(0, 100);

        return Container(
          padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: low ? AppColors.accent.withValues(alpha: 0.3) : AppColors.border,
            ),
            color: low ? AppColors.accent.withValues(alpha: 0.04) : AppColors.surface,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      color: low ? AppColors.accent.withValues(alpha: 0.1) : AppColors.background,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      low ? Icons.battery_alert_rounded : Icons.battery_std_rounded,
                      size: 18,
                      color: low ? AppColors.accent : const Color(0xFF3D8B5E),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('AI Credits',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600, fontSize: 15,
                          )),
                        Text('$remaining / 30 remaining',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: low ? AppColors.accent : AppColors.textMuted,
                            fontSize: 12,
                          )),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.push(low ? '/go-pro' : '/subscription'),
                    child: Text(low ? 'Upgrade' : 'Details',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: low ? AppColors.accent : AppColors.textMuted,
                      )),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: pct / 100,
                    minHeight: 6,
                    backgroundColor: AppColors.border.withValues(alpha: 0.5),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      low ? AppColors.accent : const Color(0xFF3D8B5E)),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
