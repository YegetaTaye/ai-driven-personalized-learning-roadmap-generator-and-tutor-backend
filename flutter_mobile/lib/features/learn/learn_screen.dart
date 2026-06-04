import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/explanation.dart';
import '../../core/models/roadmap_node.dart';
import '../../core/providers/explanation_provider.dart';
import '../../core/providers/my_learning_provider.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/Yeneta_app_bar.dart';
import '../../widgets/loading_shimmer.dart';
import 'ai_instructor_drawer.dart';
import 'explanation_panel.dart';
import 'inline_quiz_view.dart';
import 'learn_outline_drawer.dart';

class LearnScreen extends ConsumerStatefulWidget {
  const LearnScreen({
    required this.enrollmentId,
    required this.nodeId,
    super.key,
  });

  final String enrollmentId;
  final String nodeId;

  @override
  ConsumerState<LearnScreen> createState() => _LearnScreenState();
}

class _LearnScreenState extends ConsumerState<LearnScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _hasRedirected = false;
  bool _showQuiz = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(myLearningProvider.notifier).setCurrentNode(
            enrollmentId: widget.enrollmentId,
            nodeId: widget.nodeId,
          );
      ref.invalidate(roadmapProvider(widget.enrollmentId));
    });
  }

  @override
  void didUpdateWidget(LearnScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.nodeId != widget.nodeId) {
      setState(() => _showQuiz = false);
    }
  }

  void _redirectToRoadmap() {
    if (!_hasRedirected && mounted) {
      _hasRedirected = true;
      context.go('/enrollments/${widget.enrollmentId}/roadmap');
    }
  }

  void _showAiInstructor(RoadmapNode node, Explanation? explanation) {
    showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: AiInstructorDrawer(
          key: ValueKey<String>(widget.nodeId),
          node: node,
          enrollmentId: widget.enrollmentId,
          explanation: explanation,
        ),
      ),
    );
  }

  double _drawerWidth(BuildContext context) {
    return math.min(320, MediaQuery.sizeOf(context).width * 0.88);
  }

  @override
  Widget build(BuildContext context) {
    final nodeAsync = ref.watch(nodeByIdProvider(
      NodeLookupParams(
        enrollmentId: widget.enrollmentId,
        nodeId: widget.nodeId,
      ),
    ));

    final explanationParams = ExplanationParams(
      enrollmentId: widget.enrollmentId,
      nodeId: widget.nodeId,
    );
    final explanationAsync =
        ref.watch(explanationNotifierProvider(explanationParams));
    final explanation = explanationAsync.valueOrNull;

    return nodeAsync.when(
      loading: () => const Scaffold(
        body: LoadingShimmer(),
      ),
      error: (_, __) {
        Future.delayed(const Duration(seconds: 2), _redirectToRoadmap);
        return const Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Loading lesson...'),
              ],
            ),
          ),
        );
      },
      data: (node) {
        if (node == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) => _redirectToRoadmap());
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final drawerWidth = _drawerWidth(context);

        return Scaffold(
          key: _scaffoldKey,
          drawerEnableOpenDragGesture: true,
          drawer: Drawer(
            width: drawerWidth,
            child: LearnOutlineDrawer(
              enrollmentId: widget.enrollmentId,
              activeNodeId: widget.nodeId,
            ),
          ),
          appBar: YenetaAppBar(
            title: node.title,
            leading: IconButton(
              icon: const Icon(Icons.menu),
              tooltip: 'Course outline',
              onPressed: () => _scaffoldKey.currentState?.openDrawer(),
            ),
            actions: <Widget>[
              IconButton(
                icon: const Icon(Icons.smart_toy_outlined),
                tooltip: 'AI Instructor',
                onPressed: () => _showAiInstructor(node, explanation),
              ),
            ],
          ),
          body: Column(
            children: <Widget>[
              Expanded(
                child: _showQuiz
                    ? InlineQuizView(
                        nodeId: widget.nodeId,
                        enrollmentId: widget.enrollmentId,
                        onBack: () => setState(() => _showQuiz = false),
                      )
                    : _LearnBody(
                        enrollmentId: widget.enrollmentId,
                        nodeId: widget.nodeId,
                      ),
              ),
              if (!_showQuiz)
                _LearnActionBar(
                  enrollmentId: widget.enrollmentId,
                  nodeId: node.id,
                  canTakeQuiz: node.unlocked,
                  onTakeQuiz: () => setState(() => _showQuiz = true),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _LearnBody extends ConsumerWidget {
  const _LearnBody({
    required this.enrollmentId,
    required this.nodeId,
  });

  final String enrollmentId;
  final String nodeId;

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(roadmapProvider(enrollmentId));
    await Future<void>.delayed(const Duration(milliseconds: 500));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RefreshIndicator(
      onRefresh: () => _refresh(ref),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ExplanationPanel(
          enrollmentId: enrollmentId,
          nodeId: nodeId,
          embedInParentScroll: true,
        ),
      ),
    );
  }
}

class _LearnActionBar extends StatelessWidget {
  const _LearnActionBar({
    required this.enrollmentId,
    required this.nodeId,
    required this.canTakeQuiz,
    required this.onTakeQuiz,
  });

  final String enrollmentId;
  final String nodeId;
  final bool canTakeQuiz;
  final VoidCallback onTakeQuiz;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.border.withValues(alpha: 0.9)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: <Widget>[
            Expanded(
              child: FilledButton(
                onPressed: canTakeQuiz ? onTakeQuiz : null,
                child: const Text('Take quiz →'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: () =>
                    context.go('/enrollments/$enrollmentId/roadmap'),
                child: const Text('Back to roadmap'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
