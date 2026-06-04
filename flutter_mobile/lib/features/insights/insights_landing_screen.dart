import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/enrollments_provider.dart';
import '../../core/utils/format.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_shimmer.dart';

/// Insights landing screen - shows list of enrollments to view insights for
class InsightsLandingScreen extends ConsumerWidget {
  const InsightsLandingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enrollmentsAsync = ref.watch(enrollmentsProvider);

    return enrollmentsAsync.when(
      loading: () => const LoadingShimmer(),
      error: (_, __) => YenetaErrorWidget(
        message: 'Unable to load your enrollments.',
        onRetry: () => ref.invalidate(enrollmentsProvider),
      ),
      data: (enrollments) {
        if (enrollments.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.insights_outlined, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  'No enrollments yet',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Enroll in a course to see your learning insights',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () => context.go('/catalog'),
                  child: const Text('Explore Catalog'),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: enrollments.length,
          itemBuilder: (context, index) {
            final enrollment = enrollments[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  child: Icon(
                    Icons.insights,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                title: Text(
                  enrollment.domainTitle,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: enrollment.progressPercent,
                      backgroundColor: Colors.grey[200],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${(enrollment.progressPercent * 100).toInt()}% complete',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    if (enrollment.lastAccessedAt != null)
                      Text(
                        'Last accessed: ${Format.shortDate(enrollment.lastAccessedAt!)}',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                  ],
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/enrollments/${enrollment.id}/insights'),
              ),
            );
          },
        );
      },
    );
  }
}
