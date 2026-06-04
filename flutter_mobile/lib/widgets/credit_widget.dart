import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/providers/subscription_provider.dart';
import '../core/theme/app_colors.dart';

class CreditWidget extends ConsumerWidget {
  const CreditWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final creditAsync = ref.watch(creditStatusProvider);

    return creditAsync.when(
      loading: () => Padding(
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
        child: Container(
          height: 48,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
            color: AppColors.surface,
          ),
          child: const Center(
            child: SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        ),
      ),
      error: (_, __) => Padding(
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
            color: AppColors.surface,
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 14, color: AppColors.textMuted),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Credits unavailable',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textMuted,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
      data: (status) {
        if (status.unlimited || status.isPro) return const SizedBox.shrink();

        final remaining = status.creditsRemaining ?? 0;
        final total = 30;
        final pct = ((remaining / total) * 100).round().clamp(0, 100);
        final low = remaining <= 8;

        return Padding(
          padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
          child: Container(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
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
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Icon(
                      low ? Icons.battery_alert_rounded : Icons.battery_std_rounded,
                      size: 14,
                      color: low ? AppColors.accent : const Color(0xFF3D8B5E),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'AI Credits',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 1,
                            color: low ? AppColors.accent : AppColors.textMuted,
                          ),
                    ),
                    const Spacer(),
                    Text(
                      '$remaining / $total',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: low ? AppColors.accent : AppColors.textPrimary,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: pct / 100,
                    minHeight: 5,
                    backgroundColor: AppColors.border.withValues(alpha: 0.5),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      low ? AppColors.accent : const Color(0xFF3D8B5E),
                    ),
                  ),
                ),
                if (low) ...[
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () => context.push('/go-pro'),
                    child: Row(
                      children: [
                        Text(
                          'Upgrade to unlimited',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: AppColors.accent,
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                        ),
                        const SizedBox(width: 4),
                        Icon(Icons.arrow_forward_rounded,
                            size: 12, color: AppColors.accent),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
