import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';

enum UserRole { owner, member, none }

class AuthProvider extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _roleKey = 'user_role';
  static const _nameKey = 'user_name';
  static const _regIdKey = 'reg_id';

  bool _isLoading = false;
  bool _isAuthenticated = false;
  UserRole _role = UserRole.none;
  String _userName = '';
  String _regId = '';
  String _token = '';
  String? _error;

  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  UserRole get role => _role;
  String get userName => _userName;
  String get regId => _regId;
  String get token => _token;
  String? get error => _error;
  bool get isOwner => _role == UserRole.owner;
  bool get isMember => _role == UserRole.member;

  AuthProvider() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    final token = await _storage.read(key: _tokenKey);
    final roleStr = await _storage.read(key: _roleKey);
    final name = await _storage.read(key: _nameKey);
    final regId = await _storage.read(key: _regIdKey);

    if (token != null && roleStr != null) {
      _token = token;
      _userName = name ?? '';
      _regId = regId ?? '';
      _role = roleStr == 'owner' ? UserRole.owner : UserRole.member;
      _isAuthenticated = true;
      notifyListeners();
    }
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.login(identifier, password);
      final data = response['data'];
      final token = data['token'] as String;
      final role = data['role'] as String? ?? 'member';
      final name = data['name'] as String? ?? data['full_name'] as String? ?? 'User';
      final regId = data['registration_id'] as String? ?? '';

      _token = token;
      _role = role == 'owner' ? UserRole.owner : UserRole.member;
      _userName = name;
      _regId = regId;
      _isAuthenticated = true;

      await _storage.write(key: _tokenKey, value: token);
      await _storage.write(key: _roleKey, value: role);
      await _storage.write(key: _nameKey, value: name);
      await _storage.write(key: _regIdKey, value: regId);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    _isAuthenticated = false;
    _role = UserRole.none;
    _userName = '';
    _regId = '';
    _token = '';
    notifyListeners();
  }
}
