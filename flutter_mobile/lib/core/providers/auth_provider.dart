import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';

import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../config/app_config.dart';
import '../models/user.dart';
import 'users_provider.dart';

export '../models/user.dart' show UserRole;

class AuthState {
  const AuthState({
    required this.user,
    required this.tokens,
    required this.isLoading,
    this.error,
  });

  final User? user;
  final AuthTokens? tokens;
  final bool isLoading;
  final String? error;

  bool get isAuthenticated => user != null && tokens != null;

  static const AuthState loading = AuthState(
    user: null,
    tokens: null,
    isLoading: true,
  );

  static const AuthState unauthenticated = AuthState(
    user: null,
    tokens: null,
    isLoading: false,
  );

  AuthState copyWith({
    User? user,
    AuthTokens? tokens,
    bool? isLoading,
    String? error,
    bool clearError = false,
    bool clearSession = false,
  }) {
    return AuthState(
      user: clearSession ? null : (user ?? this.user),
      tokens: clearSession ? null : (tokens ?? this.tokens),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

final authApiProvider = Provider<AuthApi>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthApi(dio: apiClient.dio, apiClient: apiClient);
});

final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

class AuthNotifier extends AsyncNotifier<AuthState> {
  static const String _accessTokenKey = 'accessToken';
  static const String _refreshTokenKey = 'refreshToken';
  bool _isLoggingOut = false;
  bool _callbacksBound = false;

  FlutterSecureStorage get _storage => ref.read(secureStorageProvider);
  AuthApi get _authApi => ref.read(authApiProvider);

  @override
  Future<AuthState> build() async {
    final apiClient = ref.read(apiClientProvider);
    
    // Only bind callbacks once to avoid issues on hot reload
    if (!_callbacksBound) {
      apiClient.bindAuth(
        accessTokenGetter: () => state.valueOrNull?.tokens?.accessToken,
        refreshTokenHandler: refreshTokensFromInterceptor,
        onRefreshFailure: logout,
      );
      _callbacksBound = true;
    }

    return _initialize();
  }

  Future<AuthState> _initialize() async {
    final accessToken = await _storage.read(key: _accessTokenKey);
    final refreshToken = await _storage.read(key: _refreshTokenKey);

    if (accessToken == null || refreshToken == null) {
      return AuthState.unauthenticated;
    }

    final seed = AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    state = AsyncData(AuthState(user: null, tokens: seed, isLoading: true));

    try {
      final user = await _authApi.me();
      
      // Block admin users on app startup
      if (user.role == UserRole.admin) {
        await _clearTokens();
        return AuthState.unauthenticated;
      }
      
      return AuthState(user: user, tokens: seed, isLoading: false);
    } catch (_) {
      try {
        final tokens = await _authApi.refresh(refreshToken);
        await _persistTokens(tokens);
        final user = await _authApi.me();
        
        // Block admin users after token refresh
        if (user.role == UserRole.admin) {
          await _clearTokens();
          return AuthState.unauthenticated;
        }
        
        return AuthState(user: user, tokens: tokens, isLoading: false);
      } catch (_) {
        await _clearTokens();
        return AuthState.unauthenticated;
      }
    }
  }

  Future<void> login(String email, String password) async {
    final previous = state.valueOrNull ?? AuthState.unauthenticated;
    state = AsyncData(previous.copyWith(isLoading: true, clearError: true));

    try {
      final result = await _authApi.login(email: email, password: password);
      final user = result.$1;

      // Block admin users - mobile app doesn't support admin accounts
      if (user.role == UserRole.admin) {
        // Try to logout but don't let it fail our error message
        try {
          await _authApi.logout(result.$2.refreshToken);
        } catch (_) {
          // Ignore logout errors for blocked admins
        }
        state = AsyncData(
          previous.copyWith(
            isLoading: false,
            error: 'Admin dashboard is only accessible from the web.',
            clearSession: true,
          ),
        );
        return;
      }

      await _persistTokens(result.$2);
      state = AsyncData(
        AuthState(user: user, tokens: result.$2, isLoading: false),
      );
    } catch (error) {
      state = AsyncData(
        previous.copyWith(
          isLoading: false,
          error: _extractApiMessage(
            error,
            fallback: 'Unable to log in. Check your credentials and try again.',
          ),
          clearSession: true,
        ),
      );
    }
  }

  Future<void> register(String fullName, String email, String password) async {
    debugPrint('[AUTH_PROVIDER] register() called');
    final previous = state.valueOrNull ?? AuthState.unauthenticated;
    state = AsyncData(previous.copyWith(isLoading: true, clearError: true));

    try {
      debugPrint('[AUTH_PROVIDER] calling _authApi.register()');
      final result = await _authApi.register(
        fullName: fullName,
        email: email,
        password: password,
      );
      debugPrint('[AUTH_PROVIDER] register success, user: ${result.$1.id}');
      await _persistTokens(result.$2);
      state = AsyncData(
        AuthState(user: result.$1, tokens: result.$2, isLoading: false),
      );
      debugPrint('[AUTH_PROVIDER] state updated to authenticated');
    } catch (error) {
      debugPrint('[AUTH_PROVIDER] register FAILED: $error');
      if (error is DioException) {
        debugPrint('[AUTH_PROVIDER] DioException type: ${error.type}');
        debugPrint('[AUTH_PROVIDER] DioException response: ${error.response?.data}');
      }
      final errorMessage = _extractApiMessage(
        error,
        fallback: 'Unable to create account. Try a different email.',
      );
      debugPrint('[AUTH_PROVIDER] extracted error message: $errorMessage');
      state = AsyncData(
        previous.copyWith(isLoading: false, error: errorMessage),
      );
    }
  }

  Future<void> loginWithOAuth(String provider) async {
    final previous = state.valueOrNull ?? AuthState.unauthenticated;
    state = AsyncData(previous.copyWith(isLoading: true, clearError: true));

    try {
      final apiBaseUrl = AppConfig.apiBaseUrl;
      final baseUrl = apiBaseUrl.replaceAll(RegExp(r'/+$'), '');
      final oauthUrl = '$baseUrl/auth/oauth/$provider?redirect_uri=atlasmobile://auth/callback';

      final callbackUrl = await FlutterWebAuth2.authenticate(
        url: oauthUrl,
        callbackUrlScheme: 'atlasmobile',
      );

      final uri = Uri.parse(callbackUrl);
      final accessToken = uri.queryParameters['accessToken'];
      final refreshToken = uri.queryParameters['refreshToken'];

      if (accessToken == null || refreshToken == null) {
        throw Exception('OAuth failed: missing tokens');
      }

      final tokens = AuthTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
      await _persistTokens(tokens);

      // Seed state with tokens so the Dio interceptor has them for getMe()
      state = AsyncData(
        AuthState(user: null, tokens: tokens, isLoading: true),
      );

      final user = await _authApi.me();

      if (user.role == UserRole.admin) {
        await _clearTokens();
        state = AsyncData(
          previous.copyWith(
            isLoading: false,
            error: 'Admin dashboard is only accessible from the web.',
            clearSession: true,
          ),
        );
        return;
      }

      state = AsyncData(
        AuthState(user: user, tokens: tokens, isLoading: false),
      );
    } catch (error) {
      final message = _extractApiMessage(
        error,
        fallback: 'OAuth sign-in failed. Please try again.',
      );
      state = AsyncData(
        previous.copyWith(isLoading: false, error: message, clearSession: true),
      );
    }
  }

  Future<User?> updateProfile({
    String? fullName,
    String? avatarUrl,
    String? preferredLanguage,
    bool clearAvatar = false,
  }) async {
    final current = state.valueOrNull;
    if (current?.tokens == null) return null;

    try {
      final api = ref.read(usersApiProvider);
      final user = await api.updateMe(
        fullName: fullName,
        avatarUrl: avatarUrl,
        preferredLanguage: preferredLanguage,
        clearAvatar: clearAvatar,
      );
      state = AsyncData(
        current!.copyWith(user: user, isLoading: false, clearError: true),
      );
      ref.invalidate(usersProvider);
      return user;
    } catch (error) {
      throw _extractApiMessage(error, fallback: 'Unable to save profile.');
    }
  }

  Future<void> refreshTokens() async {
    await refreshTokensFromInterceptor();
  }

  Future<String?> refreshTokensFromInterceptor() async {
    final current = state.valueOrNull;
    final refreshToken = current?.tokens?.refreshToken;

    if (refreshToken == null) {
      return null;
    }

    final refreshed = await _authApi.refresh(refreshToken);
    await _persistTokens(refreshed);

    state = AsyncData(
      (current ?? AuthState.unauthenticated).copyWith(
        tokens: refreshed,
        isLoading: false,
        clearError: true,
      ),
    );

    return refreshed.accessToken;
  }

  Future<void> logout() async {
    debugPrint('[AUTH_PROVIDER] logout() called');
    if (_isLoggingOut) {
      debugPrint('[AUTH_PROVIDER] logout already in progress, skipping');
      return;
    }

    _isLoggingOut = true;
    final refreshToken = state.valueOrNull?.tokens?.refreshToken;
    debugPrint('[AUTH_PROVIDER] calling backend logout...');
    try {
      if (refreshToken != null) {
        try {
          await _authApi.logout(refreshToken);
          debugPrint('[AUTH_PROVIDER] backend logout success');
        } catch (e) {
          debugPrint('[AUTH_PROVIDER] backend logout failed (ignored): $e');
        }
      }

      await _clearTokens();
      debugPrint('[AUTH_PROVIDER] tokens cleared');
      state = const AsyncData(AuthState.unauthenticated);
      debugPrint('[AUTH_PROVIDER] state set to unauthenticated');
    } finally {
      _isLoggingOut = false;
    }
  }

  Future<void> _persistTokens(AuthTokens tokens) async {
    await _storage.write(key: _accessTokenKey, value: tokens.accessToken);
    await _storage.write(key: _refreshTokenKey, value: tokens.refreshToken);
  }

  Future<void> _clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  String _extractApiMessage(Object error, {required String fallback}) {
    if (error is DioException) {
      final payload = error.response?.data;
      if (payload is Map<String, dynamic>) {
        final nested = payload['error'];
        if (nested is Map<String, dynamic>) {
          final message = nested['message'];
          if (message is String && message.trim().isNotEmpty) {
            return message;
          }
        }

        final directMessage = payload['message'];
        if (directMessage is String && directMessage.trim().isNotEmpty) {
          return directMessage;
        }
      }
    }

    return fallback;
  }
}
