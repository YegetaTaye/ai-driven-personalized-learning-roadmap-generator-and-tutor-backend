import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/subscription_provider.dart';
import '../../core/theme/app_colors.dart';

class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final creditAsync = ref.watch(creditStatusProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: creditAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorBody(message: _extractMessage(e)),
        data: (status) {
          final isPro = status.isPro || status.unlimited;
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
            children: [
              _PlanHeader(theme: theme, isPro: isPro, credits: status.creditsRemaining ?? 0),
              const SizedBox(height: 24),

              if (!isPro) ...[
                _SectionLabel(theme: theme, label: 'MONTHLY USAGE'),
                const SizedBox(height: 10),
                _CreditGauge(
                  remaining: status.creditsRemaining ?? 0,
                  total: 30,
                  theme: theme,
                ),
                const SizedBox(height: 28),
              ],

              _SectionLabel(theme: theme, label: 'CREDIT COSTS'),
              const SizedBox(height: 10),
              _CostCard(theme: theme),
              const SizedBox(height: 28),

              _SectionLabel(theme: theme, label: 'PLAN COMPARISON'),
              const SizedBox(height: 10),
              _CompareCard(theme: theme, isPro: isPro),
              const SizedBox(height: 28),

              if (!isPro)
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton(
                    onPressed: () => context.push('/go-pro'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.textPrimary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                      textStyle: const TextStyle(
                        fontFamily: 'Crimson Text',
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    child: const Text('Upgrade to Scholar →'),
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: AppColors.border, width: 1.5),
                      foregroundColor: AppColors.textBody,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                      textStyle: const TextStyle(
                        fontFamily: 'Crimson Text',
                        fontSize: 16,
                      ),
                    ),
                    child: const Text('Manage subscription'),
                  ),
                ),
              const SizedBox(height: 16),
              Text(
                isPro
                    ? 'Cancel any time. Your Pro access remains until the end of the billing period.'
                    : 'No payment method required for the free plan.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.textMuted,
                  fontSize: 12,
                  height: 1.4,
                ),
              ),
            ],
          );
        },
      ),
    ),
    );
  }

  String _extractMessage(Object error) {
    final s = error.toString();
    if (s.contains('402')) return 'Insufficient credits.';
    if (s.contains('401') || s.contains('403')) {
      return 'Session expired. Please log in again.';
    }
    return s;
  }
}

// ── Section Label ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.theme, required this.label});
  final ThemeData theme;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 14,
          decoration: BoxDecoration(
            color: AppColors.accent,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            fontSize: 10,
            letterSpacing: 1.5,
            color: AppColors.textMuted,
          ),
        ),
      ],
    );
  }
}

// ── Plan Header ───────────────────────────────────────────────────────────────

class _PlanHeader extends StatelessWidget {
  const _PlanHeader({
    required this.theme,
    required this.isPro,
    required this.credits,
  });
  final ThemeData theme;
  final bool isPro;
  final int credits;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isPro
              ? const Color(0xFFB8860B).withValues(alpha: 0.3)
              : AppColors.border,
        ),
        color: AppColors.surface,
      ),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isPro
                  ? const Color(0xFFB8860B).withValues(alpha: 0.1)
                  : AppColors.border.withValues(alpha: 0.2),
            ),
            alignment: Alignment.center,
            child: Icon(
              isPro ? Icons.auto_awesome_rounded : Icons.person_outline_rounded,
              size: 36,
              color: isPro ? const Color(0xFFB8860B) : AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isPro ? 'Scholar Plan' : 'Explorer Plan',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
              fontSize: 26,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isPro
                ? 'Unlimited AI access · Priority routing'
                : 'Free tier with monthly AI credits',
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 20),
          if (isPro)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: const Color(0xFF3D8B5E).withValues(alpha: 0.1),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_rounded,
                      size: 18, color: const Color(0xFF3D8B5E)),
                  const SizedBox(width: 8),
                  Text(
                    'Active',
                    style: TextStyle(
                      color: const Color(0xFF3D8B5E),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      fontFamily: 'Crimson Text',
                    ),
                  ),
                ],
              ),
            ),
          if (!isPro) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$credits',
                  style: theme.textTheme.displayMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    fontSize: 48,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '/ 30',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'credits remaining',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Resets monthly',
              style: theme.textTheme.labelSmall?.copyWith(
                fontSize: 10,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Credit Gauge ──────────────────────────────────────────────────────────────

class _CreditGauge extends StatelessWidget {
  const _CreditGauge({
    required this.remaining,
    required this.total,
    required this.theme,
  });
  final int remaining;
  final int total;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final pct = ((remaining / total) * 100).round().clamp(0, 100);
    final low = remaining <= 8;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: low
              ? AppColors.accent.withValues(alpha: 0.3)
              : AppColors.border,
        ),
        color: low
            ? AppColors.accent.withValues(alpha: 0.04)
            : AppColors.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                low ? Icons.battery_alert_rounded : Icons.battery_std_rounded,
                size: 18,
                color: low ? AppColors.accent : const Color(0xFF3D8B5E),
              ),
              const SizedBox(width: 8),
              Text(
                low ? 'Running low' : 'On track',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: low ? AppColors.accent : const Color(0xFF3D8B5E),
                ),
              ),
              const Spacer(),
              Text(
                '$remaining / $total used',
                style: theme.textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct / 100,
              minHeight: 8,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation<Color>(
                low ? AppColors.accent : const Color(0xFF3D8B5E),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            low
                ? 'Low on credits — upgrade to Scholar for unlimited AI access.'
                : '$remaining credit${remaining == 1 ? '' : 's'} remaining this month.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: low ? AppColors.accent : AppColors.textMuted,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Cost Card ─────────────────────────────────────────────────────────────────

class _CostCard extends StatelessWidget {
  const _CostCard({required this.theme});
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final costs = [
      (Icons.auto_awesome_rounded, 'Generate AI explanation', '2 credits'),
      (Icons.quiz_outlined, 'Generate quiz', '2 credits'),
      (Icons.chat_outlined, 'AI Instructor message', '1 credit'),
      (Icons.replay_rounded, 'Micro-quiz (decay)', '1 credit'),
    ];

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        color: AppColors.surface,
      ),
      child: Column(
        children: List.generate(costs.length, (i) {
          final (icon, label, cost) = costs[i];
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Icon(icon, size: 18, color: AppColors.textMuted),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        label,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontSize: 15,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        cost,
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (i < costs.length - 1)
                Padding(
                  padding: const EdgeInsets.only(left: 64),
                  child: Divider(height: 1, color: AppColors.border.withValues(alpha: 0.4)),
                ),
            ],
          );
        }),
      ),
    );
  }
}

// ── Compare Card ──────────────────────────────────────────────────────────────

class _CompareCard extends StatelessWidget {
  const _CompareCard({required this.theme, required this.isPro});
  final ThemeData theme;
  final bool isPro;

  @override
  Widget build(BuildContext context) {
    final features = [
      ('AI credits', '30 / month', 'Unlimited'),
      ('AI routing', 'Standard', 'Priority'),
      ('Certificates', '1 per domain', 'Unlimited'),
      ('Analytics', 'Basic', 'Full history'),
      ('Early access', '—', 'Included'),
      ('Support', 'Community', '48h response'),
    ];

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        color: AppColors.surface,
      ),
      child: Column(
        children: [
          // Header row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                const SizedBox(width: 90),
                Expanded(
                  child: Text('Free',
                    style: TextStyle(
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                      letterSpacing: 1,
                      color: isPro ? AppColors.textMuted : AppColors.textPrimary,
                      fontWeight: isPro ? null : FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                Expanded(
                  child: Text('Scholar',
                    style: TextStyle(
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                      letterSpacing: 1,
                      color: isPro ? const Color(0xFF3D8B5E) : AppColors.textMuted,
                      fontWeight: isPro ? FontWeight.w600 : null,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: AppColors.border.withValues(alpha: 0.4)),

          // Feature rows
          ...List.generate(features.length, (i) {
            final (feat, free, pro) = features[i];
            return Padding(
              padding: EdgeInsets.only(
                left: 16, right: 16,
                top: 14, bottom: 14,
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 90,
                    child: Text(
                      feat,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.textMuted,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      free,
                      style: TextStyle(
                        fontFamily: 'Crimson Text',
                        fontSize: 14,
                        color: isPro ? AppColors.textMuted : AppColors.textPrimary,
                        fontWeight: isPro ? FontWeight.w400 : FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (isPro)
                          Icon(Icons.check_rounded, size: 16,
                              color: const Color(0xFF3D8B5E)),
                        const SizedBox(width: 4),
                        Text(
                          pro,
                          style: TextStyle(
                            fontFamily: 'Crimson Text',
                            fontSize: 14,
                            color: isPro
                                ? const Color(0xFF3D8B5E)
                                : AppColors.textMuted,
                            fontWeight: isPro ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ── Error ─────────────────────────────────────────────────────────────────────

class _ErrorBody extends StatelessWidget {
  const _ErrorBody({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded,
                size: 48, color: AppColors.textMuted),
            const SizedBox(height: 16),
            Text(
              'Subscription status unavailable',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textMuted,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
