import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/user.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/enrollments_provider.dart';
import '../../core/theme/app_colors.dart';
import 'widgets/account_shared.dart';
import 'widgets/enrollment_preference_card.dart';

const _languages = <MapEntry<String, String>>[
  MapEntry('en', 'English'),
  MapEntry('am', 'Amharic'),
  MapEntry('fr', 'French'),
  MapEntry('de', 'German'),
  MapEntry('es', 'Spanish'),
  MapEntry('zh', 'Chinese'),
  MapEntry('ar', 'Arabic'),
  MapEntry('pt', 'Portuguese'),
];

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TextEditingController _fullNameController;
  late final TextEditingController _avatarUrlController;
  String _language = 'en';
  bool _saving = false;
  bool _saved = false;
  String? _saveError;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController();
    _avatarUrlController = TextEditingController();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _avatarUrlController.dispose();
    super.dispose();
  }

  void _syncFromUser(User user) {
    if (_fullNameController.text != user.fullName) {
      _fullNameController.text = user.fullName;
    }
    final avatar = user.avatarUrl ?? '';
    if (_avatarUrlController.text != avatar) {
      _avatarUrlController.text = avatar;
    }
    final lang = user.preferredLanguage ?? 'en';
    if (_language != lang) {
      _language = lang;
    }
  }

  String _memberSince(User user) {
    final created = user.createdAt;
    if (created == null) return '';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return 'Member since ${months[created.month - 1]} ${created.year}';
  }

  Future<void> _save(User user) async {
    final fullName = _fullNameController.text.trim();
    final avatarUrl = _avatarUrlController.text.trim();
    final currentAvatar = user.avatarUrl ?? '';

    final hasNameChange = fullName != user.fullName;
    final hasAvatarChange = avatarUrl != currentAvatar;
    final hasLangChange = _language != (user.preferredLanguage ?? 'en');

    if (!hasNameChange && !hasAvatarChange && !hasLangChange) return;

    setState(() {
      _saving = true;
      _saveError = null;
      _saved = false;
    });

    try {
      await ref.read(authProvider.notifier).updateProfile(
            fullName: hasNameChange ? fullName : null,
            avatarUrl: hasAvatarChange && avatarUrl.isNotEmpty
                ? avatarUrl
                : null,
            clearAvatar: hasAvatarChange && avatarUrl.isEmpty,
            preferredLanguage: hasLangChange ? _language : null,
          );
      if (mounted) {
        setState(() {
          _saving = false;
          _saved = true;
        });
        Future<void>.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => _saved = false);
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _saving = false;
          _saveError = error.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider).valueOrNull;
    final user = authState?.user;
    final enrollmentsAsync = ref.watch(enrollmentsProvider);

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    _syncFromUser(user);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: <Widget>[
        AccountCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _ProfileAvatar(user: user),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 6,
                      children: <Widget>[
                        Text(
                          user.fullName,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: roleBadgeBackground(user.role),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            roleLabel(user.role),
                            style: TextStyle(
                              fontSize: 11,
                              fontFamily: 'monospace',
                              color: roleBadgeColor(user.role),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      user.email,
                      style: const TextStyle(
                        fontSize: 13,
                        fontFamily: 'monospace',
                        color: AppColors.textMuted,
                      ),
                    ),
                    if (user.createdAt != null) ...<Widget>[
                      const SizedBox(height: 4),
                      Text(
                        _memberSince(user),
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFFB0A898),
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    TextButton.icon(
                      onPressed: () => context.go('/settings'),
                      icon: const Icon(Icons.settings_outlined, size: 18),
                      label: const Text('Account settings'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.accent,
                        padding: EdgeInsets.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                    const SizedBox(height: 2),
                    TextButton.icon(
                      onPressed: () => context.go('/subscription'),
                      icon: const Icon(Icons.card_membership_outlined, size: 18),
                      label: const Text('Subscription & billing'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.accent,
                        padding: EdgeInsets.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        AccountCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const AccountSectionHeader('Account Settings'),
              const SizedBox(height: 4),
              const AccountFieldLabel('Display name'),
              const SizedBox(height: 6),
              AccountTextField(
                controller: _fullNameController,
                hint: 'Your full name',
              ),
              const SizedBox(height: 14),
              const AccountFieldLabel('Avatar URL'),
              const SizedBox(height: 6),
              AccountTextField(
                controller: _avatarUrlController,
                hint: 'https://…',
                mono: true,
              ),
              const SizedBox(height: 14),
              const AccountFieldLabel('Preferred language'),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _languages.any((e) => e.key == _language)
                    ? _language
                    : 'en',
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 4,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                ),
                items: _languages
                    .map(
                      (e) => DropdownMenuItem<String>(
                        value: e.key,
                        child: Text(e.value),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _language = value);
                },
              ),
              const SizedBox(height: 16),
              Row(
                children: <Widget>[
                  AccountPrimaryButton(
                    label: _saving ? 'Saving…' : 'Save changes',
                    loading: _saving,
                    onPressed: _saving ? null : () => _save(user),
                  ),
                  if (_saved) ...<Widget>[
                    const SizedBox(width: 12),
                    const Text(
                      '✓ Saved',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF2D6A3E),
                      ),
                    ),
                  ],
                  if (_saveError != null) ...<Widget>[
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _saveError!,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.accent,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const AccountSectionHeader('Roadmap Preferences'),
        const Text(
          'Captured at enrollment — these guide how the AI tailors your learning experience for each domain.',
          style: TextStyle(fontSize: 13, color: AppColors.textMuted),
        ),
        const SizedBox(height: 14),
        enrollmentsAsync.when(
          loading: () => const Column(
            children: <Widget>[
              _SkeletonCard(),
              SizedBox(height: 12),
              _SkeletonCard(),
            ],
          ),
          error: (_, __) => AccountCard(
            child: Text(
              'Unable to load enrollments.',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
          data: (enrollments) {
            if (enrollments.isEmpty) {
              return AccountCard(
                borderColor: AppColors.border,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                child: Column(
                  children: <Widget>[
                    const Text(
                      'No enrollments yet.',
                      style: TextStyle(
                        fontSize: 16,
                        fontStyle: FontStyle.italic,
                        color: Color(0xFF6E645A),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.go('/catalog'),
                      child: const Text('Browse the catalog →'),
                    ),
                  ],
                ),
              );
            }

            return Column(
              children: enrollments
                  .map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: EnrollmentPreferenceCard(enrollment: e),
                    ),
                  )
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    final url = user.avatarUrl;
    if (url != null && url.isNotEmpty) {
      return CircleAvatar(
        radius: 32,
        backgroundColor: const Color(0xFFE8E2D9),
        backgroundImage: NetworkImage(url),
        onBackgroundImageError: (_, __) {},
        child: url.isEmpty
            ? Text(
                userInitials(user.fullName),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF6E645A),
                ),
              )
            : null,
      );
    }

    return CircleAvatar(
      radius: 32,
      backgroundColor: const Color(0xFFE8E2D9),
      child: Text(
        userInitials(user.fullName),
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: Color(0xFF6E645A),
        ),
      ),
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 140,
      decoration: BoxDecoration(
        color: const Color(0xFFEBE6DB),
        borderRadius: BorderRadius.circular(14),
      ),
    );
  }
}
