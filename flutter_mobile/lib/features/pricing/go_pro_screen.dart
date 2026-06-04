import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';

class GoProScreen extends ConsumerStatefulWidget {
  const GoProScreen({super.key});

  @override
  ConsumerState<GoProScreen> createState() => _GoProScreenState();
}

enum _PlanId { monthly, annual }
enum _PayMethod { card, chapa }
enum _Step { plan, payment, success }

const _features = [
  'Unlimited AI credits — explanations, quizzes, chat',
  'Priority AI routing — fastest model first',
  'Unlimited certificates across all domains',
  'Full velocity history & advanced analytics',
  'Early access to new domains',
  '48 h support response',
];

class _Plan {
  final _PlanId id;
  final String label;
  final String price;
  final String per;
  final String sub;
  final bool highlight;
  const _Plan({
    required this.id,
    required this.label,
    required this.price,
    required this.per,
    required this.sub,
    required this.highlight,
  });
}

const _plans = [
  _Plan(
    id: _PlanId.monthly,
    label: 'Monthly',
    price: '\$6',
    per: '/month',
    sub: '~75 ETB · cancel any time',
    highlight: false,
  ),
  _Plan(
    id: _PlanId.annual,
    label: 'Annual',
    price: '\$4',
    per: '/month',
    sub: '\$48 billed yearly · save 33%',
    highlight: true,
  ),
];

class _GoProScreenState extends ConsumerState<GoProScreen> {
  _Step _step = _Step.plan;
  _PlanId _selectedPlan = _PlanId.annual;
  _PayMethod _payMethod = _PayMethod.card;
  bool _processing = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            if (_step != _Step.success)
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, size: 22),
                      onPressed: () => context.pop(),
                      color: AppColors.textMuted,
                    ),
                    const Spacer(),
                  ],
                ),
              ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 80),
                child: Column(
                  children: [
                    if (_step != _Step.success)
                      _StepIndicator(current: _step),
                    const SizedBox(height: 32),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: switch (_step) {
                        _Step.plan => _PlanSelection(
                            key: const ValueKey('plan'),
                            theme: theme,
                            selected: _selectedPlan,
                            onSelect: (id) =>
                                setState(() => _selectedPlan = id),
                            onContinue: () =>
                                setState(() => _step = _Step.payment),
                          ),
                        _Step.payment => _PaymentStep(
                            key: const ValueKey('payment'),
                            theme: theme,
                            payMethod: _payMethod,
                            onPayMethodChange: (m) =>
                                setState(() => _payMethod = m),
                            processing: _processing,
                            onPay: _handlePay,
                          ),
                        _Step.success => _SuccessStep(
                            key: const ValueKey('success'),
                            theme: theme,
                          ),
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handlePay() {
    setState(() => _processing = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _processing = false);
      if (mounted) setState(() => _step = _Step.success);
    });
  }
}

// ── Step Indicator ────────────────────────────────────────────────────────────

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.current});
  final _Step current;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildDot(1, 'Choose plan', current == _Step.plan,
            current.index > _Step.plan.index),
        const SizedBox(width: 12),
        _buildLine(current == _Step.payment),
        const SizedBox(width: 12),
        _buildDot(2, 'Payment', current == _Step.payment,
            current.index > _Step.payment.index),
      ],
    );
  }

  Widget _buildDot(int num, String label, bool active, bool done) {
    final fill = done
        ? const Color(0xFF3D8B5E)
        : active
            ? AppColors.textPrimary
            : const Color(0xFFEBE6DB);
    final textColor = done || active ? Colors.white : AppColors.textMuted;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: fill,
          ),
          alignment: Alignment.center,
          child: Text(
            done ? '✓' : '$num',
            style: TextStyle(
              color: textColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              fontFamily: 'JetBrains Mono',
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: active ? AppColors.textPrimary : AppColors.textMuted,
            fontSize: 12,
            fontFamily: 'JetBrains Mono',
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildLine(bool active) {
    return Container(
      width: 40,
      height: 1,
      color: active ? const Color(0xFF3D8B5E) : AppColors.border,
    );
  }
}

// ── Plan Selection ────────────────────────────────────────────────────────────

class _PlanSelection extends StatelessWidget {
  const _PlanSelection({
    super.key,
    required this.theme,
    required this.selected,
    required this.onSelect,
    required this.onContinue,
  });
  final ThemeData theme;
  final _PlanId selected;
  final ValueChanged<_PlanId> onSelect;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Upgrade to Scholar',
          style: theme.textTheme.headlineMedium?.copyWith(
            fontSize: 32,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Unlimited AI, priority routing, and full analytics. Cancel any time.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: AppColors.textMuted,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 28),
        ..._plans.map(
          (p) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _PlanCard(
              plan: p,
              selected: p.id == selected,
              onTap: () => onSelect(p.id),
            ),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: onContinue,
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
            child: const Text('Continue to payment →'),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(
            'Secure checkout · Cancel any time · No hidden fees',
            style: theme.textTheme.labelSmall?.copyWith(fontSize: 10),
          ),
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.selected,
    required this.onTap,
  });
  final _Plan plan;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.border,
            width: selected ? 2 : 1,
          ),
          color: selected
              ? AppColors.accent.withValues(alpha: 0.04)
              : AppColors.background,
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            if (plan.highlight)
              Positioned(
                top: -10,
                right: 16,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'Best value',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      fontSize: 9,
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: selected ? AppColors.accent : AppColors.border,
                      width: 2,
                    ),
                    color: selected ? AppColors.accent : Colors.transparent,
                  ),
                  alignment: Alignment.center,
                  child: selected
                      ? Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        plan.label.toUpperCase(),
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontSize: 10,
                          letterSpacing: 1.5,
                          color: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            plan.price,
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontSize: 38,
                              fontWeight: FontWeight.w400,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            plan.per,
                            style: theme.textTheme.labelSmall?.copyWith(
                              fontSize: 14,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        plan.sub,
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontSize: 11,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Payment Step ──────────────────────────────────────────────────────────────

class _PaymentStep extends StatelessWidget {
  const _PaymentStep({
    super.key,
    required this.theme,
    required this.payMethod,
    required this.onPayMethodChange,
    required this.processing,
    required this.onPay,
  });
  final ThemeData theme;
  final _PayMethod payMethod;
  final ValueChanged<_PayMethod> onPayMethodChange;
  final bool processing;
  final VoidCallback onPay;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Payment details',
          style: theme.textTheme.headlineMedium?.copyWith(
            fontSize: 28,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Choose how you\'d like to pay',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: _PayMethodBtn(
                label: 'Credit / Debit card',
                icon: Icons.credit_card_rounded,
                selected: payMethod == _PayMethod.card,
                onTap: () => onPayMethodChange(_PayMethod.card),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _PayMethodBtn(
                label: 'Chapa (ETH)',
                icon: Icons.phone_android_rounded,
                selected: payMethod == _PayMethod.chapa,
                onTap: () => onPayMethodChange(_PayMethod.chapa),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: payMethod == _PayMethod.card
              ? _CardForm(theme: theme)
              : _ChapaForm(theme: theme),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: processing ? null : onPay,
            style: FilledButton.styleFrom(
              backgroundColor:
                  processing ? AppColors.textMuted : AppColors.textPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(999),
              ),
              textStyle: const TextStyle(
                fontFamily: 'Crimson Text',
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            child: Text(
              processing
                  ? 'Processing…'
                  : 'Pay \$${_selectedPlan() == _PlanId.annual ? '48' : '6'} →',
            ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(
            '256-bit SSL encryption · PCI compliant · Cancel any time',
            style: theme.textTheme.labelSmall?.copyWith(fontSize: 10),
          ),
        ),
      ],
    );
  }

  _PlanId _selectedPlan() {
    // Simplified — in a real app this would come from state
    return _PlanId.annual;
  }
}

class _PayMethodBtn extends StatelessWidget {
  const _PayMethodBtn({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.border,
            width: selected ? 2 : 1,
          ),
          color: selected
              ? AppColors.accent.withValues(alpha: 0.05)
              : AppColors.surface,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20,
                color: selected ? AppColors.accent : AppColors.textBody),
            const SizedBox(width: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: selected ? FontWeight.w600 : null,
                    color: selected ? AppColors.textPrimary : AppColors.textBody,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CardForm extends StatelessWidget {
  const _CardForm({required this.theme});
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: const ValueKey('card'),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        color: AppColors.surface,
      ),
      child: Column(
        children: [
          _CardField(
            label: 'Card number',
            placeholder: '1234  5678  9012  3456',
            theme: theme,
            prefix: Icons.credit_card_outlined,
          ),
          const SizedBox(height: 16),
          _CardField(
            label: 'Name on card',
            placeholder: 'Your Name',
            theme: theme,
            prefix: Icons.person_outline,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _CardField(
                  label: 'Expiry',
                  placeholder: 'MM / YY',
                  theme: theme,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _CardField(
                  label: 'CVC',
                  placeholder: '···',
                  theme: theme,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CardField extends StatelessWidget {
  const _CardField({
    required this.label,
    required this.placeholder,
    required this.theme,
    this.prefix,
  });
  final String label;
  final String placeholder;
  final ThemeData theme;
  final IconData? prefix;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: theme.textTheme.labelSmall?.copyWith(
            fontSize: 10,
            letterSpacing: 1.2,
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.textMuted.withValues(alpha: 0.6),
            ),
            prefixIcon: prefix != null
                ? Icon(prefix, size: 18, color: AppColors.textMuted)
                : null,
            filled: true,
            fillColor: AppColors.background,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.border),
            ),
          ),
        ),
      ],
    );
  }
}

class _ChapaForm extends StatelessWidget {
  const _ChapaForm({required this.theme});
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: const ValueKey('chapa'),
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(16),
        color: AppColors.surface,
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.accent.withValues(alpha: 0.1),
            ),
            child: const Icon(Icons.phone_android_rounded,
                size: 32, color: AppColors.accent),
          ),
          const SizedBox(height: 16),
          Text(
            'Pay with Chapa',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Telebirr · CBEBirr · Awash Birr · Visa/Mastercard',
            style: theme.textTheme.labelSmall?.copyWith(
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline,
                    size: 16, color: AppColors.textMuted),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "You'll be redirected to Chapa's secure checkout.",
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.textMuted,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Success Step ──────────────────────────────────────────────────────────────

class _SuccessStep extends StatelessWidget {
  const _SuccessStep({super.key, required this.theme});
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 40),
        Container(
          width: 88,
          height: 88,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF3D8B5E).withValues(alpha: 0.1),
            border: Border.all(
              color: const Color(0xFF3D8B5E),
              width: 2,
            ),
          ),
          alignment: Alignment.center,
          child: const Icon(
            Icons.check_rounded,
            size: 44,
            color: Color(0xFF3D8B5E),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          "You're on Scholar!",
          style: theme.textTheme.headlineMedium?.copyWith(
            fontSize: 36,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Unlimited AI, priority routing, and full analytics are now active.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppColors.textMuted,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 36),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(16),
            color: AppColors.surface,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 4,
                    height: 16,
                    decoration: BoxDecoration(
                      color: const Color(0xFF3D8B5E),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    "WHAT'S NOW UNLOCKED",
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontSize: 10,
                      letterSpacing: 1.5,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              for (final f in _features.take(4))
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: const Color(0xFF3D8B5E).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.check_rounded,
                            size: 14, color: Color(0xFF3D8B5E)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          f,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontSize: 14,
                            color: AppColors.textBody,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: FilledButton(
            onPressed: () => context.go('/dashboard'),
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
            child: const Text('Go to dashboard →'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton(
            onPressed: () => context.go('/catalog'),
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
            child: const Text('Browse domains'),
          ),
        ),
      ],
    );
  }
}
