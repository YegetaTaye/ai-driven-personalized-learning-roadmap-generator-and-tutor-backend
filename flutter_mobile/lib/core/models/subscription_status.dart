enum SubscriptionTier { free, pro }

SubscriptionTier _tierFromJson(String value) {
  switch (value) {
    case 'pro':
      return SubscriptionTier.pro;
    default:
      return SubscriptionTier.free;
  }
}

class CreditStatus {
  const CreditStatus({
    required this.tier,
    required this.unlimited,
    this.creditsRemaining,
    this.creditsResetAt,
  });

  final SubscriptionTier tier;
  final bool unlimited;
  final int? creditsRemaining;
  final String? creditsResetAt;

  bool get isPro => tier == SubscriptionTier.pro || unlimited;

  factory CreditStatus.fromJson(Map<String, dynamic> json) {
    return CreditStatus(
      tier: _tierFromJson(json['tier'] as String? ?? 'free'),
      unlimited: json['unlimited'] as bool? ?? false,
      creditsRemaining: json['creditsRemaining'] as int?,
      creditsResetAt: json['creditsResetAt'] as String?,
    );
  }
}
