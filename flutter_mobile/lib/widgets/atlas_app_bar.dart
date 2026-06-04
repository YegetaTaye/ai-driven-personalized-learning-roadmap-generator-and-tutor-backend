import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

class YenetaAppBar extends StatelessWidget implements PreferredSizeWidget {
  const YenetaAppBar({
    required this.title,
    this.actions,
    this.leading,
    this.bottom,
    super.key,
  });

  final String title;
  final List<Widget>? actions;
  final Widget? leading;

  /// Optional slot below the title row (e.g. [TabBar]). Divider is omitted when set.
  final PreferredSizeWidget? bottom;

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      leading: leading,
      actions: actions,
      bottom: bottom ??
          PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Divider(
              height: 1,
              color: AppColors.border.withValues(alpha: 0.7),
            ),
          ),
    );
  }

  @override
  Size get preferredSize {
    final bottomHeight = bottom?.preferredSize.height ?? 1;
    return Size.fromHeight(kToolbarHeight + bottomHeight);
  }
}
