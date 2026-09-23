import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  // For Android emulator: http://10.0.2.2:5000/api
  // For physical device: http://<YOUR_LAN_IP>:5000/api
  static const String _baseUrl = 'http://10.0.2.2:5000/api';
  static const _storage = FlutterSecureStorage();

  static Dio _createDio() {
    final dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        final message = e.response?.data?['message'] ?? e.message ?? 'Network error';
        return handler.reject(DioException(
          requestOptions: e.requestOptions,
          error: message,
          message: message.toString(),
        ));
      },
    ));

    return dio;
  }

  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      final res = await _createDio().post('/auth/login', data: {
        'identifier': identifier,
        'password': password,
      });
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Login failed');
    }
  }

  static Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final res = await _createDio().get(endpoint);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Request failed');
    }
  }

  static Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final res = await _createDio().post(endpoint, data: data);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Request failed');
    }
  }

  static Future<Map<String, dynamic>> put(String endpoint, Map<String, dynamic> data) async {
    try {
      final res = await _createDio().put(endpoint, data: data);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? 'Request failed');
    }
  }

  // Dashboard
  static Future<Map<String, dynamic>> getDashboardStats() => get('/dashboard/stats');

  // Members
  static Future<Map<String, dynamic>> getMembers() => get('/members');
  static Future<Map<String, dynamic>> createMember(Map<String, dynamic> data) => post('/members', data);

  // Attendance
  static Future<Map<String, dynamic>> getAttendance() => get('/attendance/today');
  static Future<Map<String, dynamic>> markAttendance(String regId) => post('/attendance/manual', {'registration_id': regId});

  // Trainers
  static Future<Map<String, dynamic>> getTrainers() => get('/trainers');
  static Future<Map<String, dynamic>> createTrainer(Map<String, dynamic> data) => post('/trainers', data);

  // Plans
  static Future<Map<String, dynamic>> getPlans() => get('/membership-plans');
  static Future<Map<String, dynamic>> createPlan(Map<String, dynamic> data) => post('/membership-plans', data);

  // Payments
  static Future<Map<String, dynamic>> getPayments() => get('/payments');
  static Future<Map<String, dynamic>> getExpenses() => get('/expenses');
  static Future<Map<String, dynamic>> addExpense(Map<String, dynamic> data) => post('/expenses', data);

  // Leads
  static Future<Map<String, dynamic>> getLeads() => get('/leads');
  static Future<Map<String, dynamic>> addLead(Map<String, dynamic> data) => post('/leads', data);
  static Future<Map<String, dynamic>> convertLead(String id) => put('/leads/$id/convert', {});

  // Workouts
  static Future<Map<String, dynamic>> getWorkouts() => get('/workouts');
  static Future<Map<String, dynamic>> getDiets() => get('/diets');

  // Notifications
  static Future<Map<String, dynamic>> broadcast(Map<String, dynamic> data) => post('/notifications/broadcast', data);
  static Future<Map<String, dynamic>> createAnnouncement(Map<String, dynamic> data) => post('/announcements', data);

  // Settings
  static Future<Map<String, dynamic>> getSettings() => get('/settings');
  static Future<Map<String, dynamic>> updateSettings(Map<String, dynamic> data) => post('/settings', data);

  // Member-specific
  static Future<Map<String, dynamic>> getMemberProfile() => get('/members/profile');
  static Future<Map<String, dynamic>> getMemberWorkout() => get('/workouts/my');
  static Future<Map<String, dynamic>> getMemberDiet() => get('/diets/my');
}
