import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/roadmap_node.dart';
import '../../core/providers/enrollments_provider.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/Yeneta_app_bar.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_shimmer.dart';
import '../resources/resources_panel.dart';
import 'node_detail_sheet.dart';
import 'progress_stats_bar.dart';
import 'roadmap_graph_canvas.dart';
import 'roadmap_node_presentation.dart';

class RoadmapScreen extends ConsumerStatefulWidget {
  const RoadmapScreen({required this.enrollmentId, super.key});

  final String enrollmentId;

  @override
  ConsumerState<RoadmapScreen> createState() => _RoadmapScreenState();
}

class _RoadmapScreenState extends ConsumerState<RoadmapScreen> {
  String? _activeNodeId;

  @override
  Widget build(BuildContext context) {
    final roadmapAsync = ref.watch(roadmapBundleProvider(widget.enrollmentId));
    final enrollmentAsync =
        ref.watch(enrollmentByIdProvider(widget.enrollmentId));

    return roadmapAsync.when(
      loading: () => const LoadingShimmer(),
      error: (_, __) => YenetaErrorWidget(
        message: 'Unable to load roadmap.',
        onRetry: () =>
            ref.invalidate(roadmapBundleProvider(widget.enrollmentId)),
      ),
      data: (bundle) {
        if (bundle.roadmap.nodes.isEmpty) {
          return const Center(child: Text('No roadmap nodes available yet.'));
        }

        final title = enrollmentAsync.valueOrNull?.domainTitle ?? 'Roadmap';
        final nextUpId =
            RoadmapNodePresentation.resolveNextUpNodeId(bundle.roadmap);

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: YenetaAppBar(
            title: title,
            actions: <Widget>[
              IconButton(
                icon: const Icon(Icons.insights_outlined),
                tooltip: 'Insights',
                onPressed: () {
                  context.push(
                    '/enrollments/${widget.enrollmentId}/insights',
                  );
                },
              ),
            ],
          ),
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              ProgressStatsBar(
                stats: bundle.stats,
                pathLabel: '$title path',
              ),
              Expanded(
                child: RoadmapGraphCanvas(
                  key: ValueKey<int>(
                    Object.hash(
                      bundle.roadmap.nodes.length,
                      bundle.roadmap.edges.length,
                      bundle.roadmap.selectedBranchPath,
                    ),
                  ),
                  roadmap: bundle.roadmap,
                  nextUpNodeId: nextUpId,
                  activeNodeId: _activeNodeId,
                  onNodeTap: _onNodeTap,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _onNodeTap(RoadmapNode mapped) {
    setState(() {
      _activeNodeId = mapped.id;
    });

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => NodeDetailSheet(
        enrollmentId: widget.enrollmentId,
        node: mapped,
        onLearn: () {
          Navigator.of(context).pop();
          context.go(
            '/enrollments/${widget.enrollmentId}/learn/${mapped.id}',
          );
        },
        onQuiz: () {
          Navigator.of(context).pop();
          context.go(
            '/enrollments/${widget.enrollmentId}/quiz/${mapped.id}',
          );
        },
        onResources: () {
          showResourcesPanel(
            context,
            nodeId: mapped.id,
          );
        },
      ),
    ).then((_) {
      if (mounted) {
        setState(() {
          _activeNodeId = null;
        });
      }
    });
  }
}
