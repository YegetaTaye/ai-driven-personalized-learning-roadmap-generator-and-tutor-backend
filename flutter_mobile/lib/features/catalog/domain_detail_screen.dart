import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/enrollment.dart';
import '../../core/providers/domains_provider.dart';
import '../../core/providers/enrollments_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_shimmer.dart';
import 'domain_meta.dart';
import 'enroll_bottom_sheet.dart';

class DomainDetailScreen extends ConsumerWidget {
  const DomainDetailScreen({required this.slug, super.key});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final domainAsync = ref.watch(domainBySlugProvider(slug));
    final enrollments = ref.watch(enrollmentsProvider).valueOrNull ?? const [];

    return domainAsync.when(
      loading: () => const SafeArea(
        bottom: false,
        child: LoadingShimmer(),
      ),
      error: (_, __) => SafeArea(
        bottom: false,
        child: YenetaErrorWidget(
          message: 'Unable to load domain details.',
          onRetry: () => ref.invalidate(domainBySlugProvider(slug)),
        ),
      ),
      data: (domain) {
        Enrollment? enrollment;
        for (final e in enrollments) {
          if (e.domainId == domain.id) {
            enrollment = e;
            break;
          }
        }
        final activeEnrollment = enrollment;
        final meta = domainMetaForSlug(domain.slug);
        final isEnrolled = activeEnrollment != null;

        final nodesLabel = domain.nodeCount != null
            ? '${domain.nodeCount}+'
            : '40+';
        final hoursLabel = domain.estimatedHours != null
            ? '~${domain.estimatedHours} hrs'
            : '~80 hrs';

        return SafeArea(
          bottom: false,
          child: CustomScrollView(
            slivers: <Widget>[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    TextButton.icon(
                      onPressed: () => context.go('/catalog'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.textMuted,
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      icon: const Icon(Icons.arrow_back, size: 16),
                      label: const Text('Back to Catalog'),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        _DomainHeroIcon(meta: meta, iconUrl: domain.iconUrl),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                domain.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineMedium
                                      ?.copyWith(
                                        fontSize: 32,
                                        height: 1.15,
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w600,
                                      ),
                              ),
                              if (domain.description != null &&
                                  domain.description!.trim().isNotEmpty) ...<Widget>[
                                const SizedBox(height: 8),
                                Text(
                                  domain.description!.trim(),
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyLarge
                                      ?.copyWith(
                                        fontSize: 16,
                                        height: 1.4,
                                        color: AppColors.textBody,
                                      ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Wrap(
                        spacing: 24,
                        runSpacing: 12,
                        children: <Widget>[
                          _StatItem(
                            icon: Icons.menu_book_outlined,
                            label: 'Learning nodes',
                            value: nodesLabel,
                          ),
                          _StatItem(
                            icon: Icons.schedule_outlined,
                            label: 'Estimated time',
                            value: hoursLabel,
                          ),
                          const _StatItem(
                            icon: Icons.account_tree_outlined,
                            label: 'Branch paths',
                            value: '3',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            'Personalised Roadmap',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontSize: 17,
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Your roadmap is generated by AI based on your free time, '
                            'familiarity, and learning goals — then fleshed out by a '
                            'Teacher Model that explains each concept in context.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  fontSize: 14,
                                  height: 1.45,
                                  color: AppColors.textBody,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () async {
                          if (activeEnrollment != null) {
                            context.go(
                              '/enrollments/${activeEnrollment.id}/roadmap',
                            );
                            return;
                          }

                          final enrollmentId =
                              await showModalBottomSheet<String>(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) =>
                                EnrollBottomSheet(domain: domain),
                          );

                          if (enrollmentId != null && context.mounted) {
                            context.go('/enrollments/$enrollmentId/roadmap');
                          }
                        },
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          foregroundColor: AppColors.background,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          isEnrolled
                              ? 'Continue Learning →'
                              : 'Enroll Now',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    if (activeEnrollment != null) ...<Widget>[
                      const SizedBox(height: 12),
                      Center(
                        child: TextButton(
                          onPressed: () async {
                            final id = activeEnrollment.id;
                            await ref
                                .read(enrollNotifierProvider.notifier)
                                .unenroll(id);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Unenrolled successfully.'),
                                ),
                              );
                            }
                          },
                          child: Text(
                            'Unenroll from this domain',
                            style: TextStyle(color: AppColors.textMuted),
                          ),
                        ),
                      ),
                    ],
                  ],
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

class _DomainHeroIcon extends StatelessWidget {
  const _DomainHeroIcon({required this.meta, this.iconUrl});

  final DomainMeta meta;
  final String? iconUrl;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        color: meta.background,
        borderRadius: BorderRadius.circular(16),
      ),
      alignment: Alignment.center,
      child: iconUrl != null && iconUrl!.isNotEmpty
          ? Image.network(
              iconUrl!,
              width: 36,
              height: 36,
              errorBuilder: (_, __, ___) => _glyph(),
            )
          : _glyph(),
    );
  }

  Widget _glyph() {
    return Text(
      meta.icon,
      style: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: meta.accent,
        fontFamily: 'monospace',
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Icon(icon, size: 16, color: AppColors.textMuted),
        const SizedBox(width: 8),
        Text(
          '$label:',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textBody,
                fontSize: 14,
              ),
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }
}
