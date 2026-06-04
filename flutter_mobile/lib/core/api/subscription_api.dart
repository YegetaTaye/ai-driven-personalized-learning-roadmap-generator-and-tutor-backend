import '../models/subscription_status.dart';

class SubscriptionApi {
  static const int freeCredits = 30;

  static const Map<String, int> creditCosts = {
    'explanation': 2,
    'quiz': 2,
    'ask': 1,
    'microQuiz': 1,
  };

  Future<CreditStatus> getCreditStatus() async {
    // Mock data — no backend call.
    // Replace with real API call when subscription service is deployed.
    await Future.delayed(const Duration(milliseconds: 300));
    return const CreditStatus(
      tier: SubscriptionTier.free,
      unlimited: false,
      creditsRemaining: 22,
      creditsResetAt: null,
    );
  }
}
