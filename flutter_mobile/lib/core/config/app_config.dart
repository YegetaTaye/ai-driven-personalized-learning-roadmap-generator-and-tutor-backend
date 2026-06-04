import 'package:flutter/foundation.dart';

class AppConfig {
  const AppConfig._();

  static String get apiBaseUrl {
    if (kIsWeb) {
      return const String.fromEnvironment(
        'Yeneta_API_BASE_URL',
        defaultValue: 'https://api.yegna-future.site/api/v1',
      );
    }

    return const String.fromEnvironment(
      'Yeneta_API_BASE_URL',
      defaultValue: 'https://api.yegna-future.site/api/v1',
    );
  }
}
