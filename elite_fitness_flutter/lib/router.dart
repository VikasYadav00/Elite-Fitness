import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/auth/auth_provider.dart';
import 'features/auth/splash_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/owner/owner_shell.dart';
import 'features/owner/dashboard/dashboard_screen.dart';
import 'features/owner/members/members_screen.dart';
import 'features/owner/plans/plans_screen.dart';
import 'features/owner/payments/payments_screen.dart';
import 'features/owner/attendance/attendance_screen.dart';
import 'features/owner/trainers/trainers_screen.dart';
import 'features/owner/workouts_diets/workouts_diets_screen.dart';
import 'features/owner/leads/leads_screen.dart';
import 'features/owner/broadcast/broadcast_screen.dart';
import 'features/owner/reports/reports_screen.dart';
import 'features/owner/settings/settings_screen.dart';
import 'features/member/member_shell.dart';
import 'features/member/home/home_screen.dart';
import 'features/member/workout/workout_screen.dart';
import 'features/member/diet/diet_screen.dart';
import 'features/member/qr_pass/qr_pass_screen.dart';
import 'features/member/profile/profile_screen.dart';

GoRouter createRouter(BuildContext context) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final auth = context.read<AuthProvider>();
      final isAuth = auth.isAuthenticated;
      final isSplash = state.matchedLocation == '/splash';
      final isLogin = state.matchedLocation == '/login';

      if (isSplash) return null;
      if (!isAuth && !isLogin) return '/login';
      if (isAuth && isLogin) {
        return auth.isOwner ? '/owner/dashboard' : '/member/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),

      // ── OWNER ROUTES ──
      ShellRoute(
        builder: (context, state, child) => OwnerShell(currentPath: state.matchedLocation, child: child),
        routes: [
          GoRoute(path: '/owner/dashboard', builder: (_, __) => const DashboardScreen()),
          GoRoute(
            path: '/owner/members',
            builder: (_, state) => MembersScreen(
              initialFilter: state.uri.queryParameters['filter'] ?? 'ALL',
            ),
          ),
          GoRoute(path: '/owner/plans', builder: (_, __) => const PlansScreen()),
          GoRoute(path: '/owner/payments', builder: (_, __) => const PaymentsScreen()),
          GoRoute(path: '/owner/attendance', builder: (_, __) => const AttendanceScreen()),
          GoRoute(path: '/owner/trainers', builder: (_, __) => const TrainersScreen()),
          GoRoute(path: '/owner/workouts', builder: (_, __) => const WorkoutsDietsScreen()),
          GoRoute(path: '/owner/leads', builder: (_, __) => const LeadsScreen()),
          GoRoute(path: '/owner/broadcast', builder: (_, __) => const BroadcastScreen()),
          GoRoute(path: '/owner/reports', builder: (_, __) => const ReportsScreen()),
          GoRoute(path: '/owner/settings', builder: (_, __) => const SettingsScreen()),
        ],
      ),

      // ── MEMBER ROUTES ──
      ShellRoute(
        builder: (context, state, child) => MemberShell(currentPath: state.matchedLocation, child: child),
        routes: [
          GoRoute(path: '/member/home', builder: (_, __) => const MemberHomeScreen()),
          GoRoute(path: '/member/workout', builder: (_, __) => const MemberWorkoutScreen()),
          GoRoute(path: '/member/diet', builder: (_, __) => const MemberDietScreen()),
          GoRoute(path: '/member/pass', builder: (_, __) => const QRPassScreen()),
          GoRoute(path: '/member/profile', builder: (_, __) => const MemberProfileScreen()),
        ],
      ),
    ],
  );
}
