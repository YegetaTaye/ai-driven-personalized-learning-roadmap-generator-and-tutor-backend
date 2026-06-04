import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/enrollment.dart';
import '../../core/providers/domains_provider.dart';
import '../../core/providers/enrollments_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_shimmer.dart';
import 'catalog_search_field.dart';
import 'domain_card.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _clearSearch() {
    setState(() {
      _searchQuery = '';
      _searchController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final domainsAsync = ref.watch(domainsProvider);
    final enrollmentsAsync = ref.watch(enrollmentsProvider);

    return domainsAsync.when(
      loading: () => const LoadingShimmer(),
      error: (_, __) => YenetaErrorWidget(
        message: 'Unable to load domains.',
        onRetry: () => ref.invalidate(domainsProvider),
      ),
      data: (domains) {
        final enrollmentByDomainId = <String, Enrollment>{
          for (final e in enrollmentsAsync.valueOrNull ?? <Enrollment>[])
            e.domainId: e,
        };

        final query = _searchQuery.trim().toLowerCase();
        final filtered = query.isEmpty
            ? domains
            : domains.where((d) {
                return d.name.toLowerCase().contains(query) ||
                    d.displayDescription.toLowerCase().contains(query);
              }).toList();

        final width = MediaQuery.sizeOf(context).width;
        final crossAxisCount = width >= 980
            ? 4
            : width >= 700
                ? 3
                : width >= 480
                    ? 2
                    : 1;

        return Container(
          color: const Color(0xFFF3EFE7),
          child: CustomScrollView(
          slivers: <Widget>[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                'Explore Learning Domains',
                                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                      fontSize: 28,
                                      height: 1.15,
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Choose a domain to start your personalised roadmap',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      fontSize: 15,
                                      color: AppColors.textBody,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    CatalogSearchField(
                      controller: _searchController,
                      onChanged: (value) =>
                          setState(() => _searchQuery = value),
                      onClear: _clearSearch,
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            if (filtered.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Icon(
                          Icons.search_off_outlined,
                          size: 40,
                          color: AppColors.textMuted,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          query.isEmpty
                              ? 'No domains available'
                              : 'No domains match your search',
                          style: Theme.of(context).textTheme.titleMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          query.isEmpty
                              ? 'Check back soon.'
                              : 'Try a different search term.',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverGrid(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: crossAxisCount == 1 ? 1.55 : 0.82,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final domain = filtered[index];
                      final enrollment = enrollmentByDomainId[domain.id];

                      return DomainCard(
                        domain: domain,
                        enrollment: enrollment,
                        onTap: () {
                          if (enrollment != null) {
                            context.go(
                              '/enrollments/${enrollment.id}/roadmap',
                            );
                          } else {
                            context.go('/catalog/${domain.slug}');
                          }
                        },
                      );
                    },
                    childCount: filtered.length,
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


