import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/subscription_api.dart';
import '../models/subscription_status.dart';

final subscriptionApiProvider = Provider<SubscriptionApi>(
  (ref) => SubscriptionApi(),
);

final creditStatusProvider = FutureProvider<CreditStatus>(
  (ref) async {
    final api = ref.watch(subscriptionApiProvider);
    return api.getCreditStatus();
  },
);

final isUnlimitedProvider = Provider<bool>(
  (ref) {
    final creditAsync = ref.watch(creditStatusProvider);
    return creditAsync.when(
      data: (s) => s.isPro || s.unlimited,
      loading: () => false,
      error: (_, __) => false,
    );
  },
);
