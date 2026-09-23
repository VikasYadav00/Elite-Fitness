import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/widgets/glass_card.dart';

class MemberProfileScreen extends StatefulWidget {
  const MemberProfileScreen({super.key});

  @override
  State<MemberProfileScreen> createState() => _MemberProfileScreenState();
}

class _MemberProfileScreenState extends State<MemberProfileScreen> {
  final Map<String, dynamic> _profile = {
    'name': 'Rahul Sharma',
    'phone': '+91 98765 43210',
    'email': 'rahul.sharma@gmail.com',
    'registration_id': 'EF-2026-0842',
    'gender': 'Male',
    'blood_group': 'O+',
    'emergency_contact': '+91 98765 00099 (Spouse)',
    'membership': {
      'plan': 'Annual VIP Elite',
      'start_date': '01 Mar 2026',
      'end_date': '28 Feb 2027',
      'amount_paid': 12000,
      'status': 'ACTIVE',
    },
    'stats': {
      'weight': '78.5 kg',
      'height': '178 cm',
      'bmi': '24.8',
      'body_fat': '16.2%',
    },
    'recent_attendance': [
      {'date': 'Today, 19 Sep', 'time': '07:15 AM', 'type': 'Turnstile QR'},
      {'date': 'Yesterday, 18 Sep', 'time': '07:22 AM', 'type': 'Turnstile QR'},
      {'date': '17 Sep 2026', 'time': '06:58 AM', 'type': 'Turnstile QR'},
      {'date': '16 Sep 2026', 'time': '07:30 AM', 'type': 'Turnstile QR'},
    ],
  };

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final m = _profile['membership'] as Map<String, dynamic>;
    final s = _profile['stats'] as Map<String, dynamic>;
    final attendance = _profile['recent_attendance'] as List;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Header
          GlassCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: const Color(0xFFF59E0B).withOpacity(0.2),
                  child: const Text('RS', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 26, fontWeight: FontWeight.w900)),
                ),
                const SizedBox(height: 12),
                Text(_profile['name'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                const SizedBox(height: 4),
                Text('Member ID: ${_profile['registration_id']}', style: const TextStyle(fontSize: 13, color: Color(0xFFF59E0B), fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text('${_profile['phone']} • ${_profile['email']}', style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Body Metrics Stats
          Row(
            children: [
              _metricCard('WEIGHT', s['weight'], Icons.monitor_weight),
              const SizedBox(width: 8),
              _metricCard('HEIGHT', s['height'], Icons.height),
              const SizedBox(width: 8),
              _metricCard('BMI', s['bmi'], Icons.speed),
              const SizedBox(width: 8),
              _metricCard('BODY FAT', s['body_fat'], Icons.fitness_center),
            ],
          ),
          const SizedBox(height: 16),

          // Active Membership Card
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Membership Plan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                      child: const Text('ACTIVE', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _planRow('Plan Name', m['plan']),
                _planRow('Start Date', m['start_date']),
                _planRow('Renewal Date', m['end_date']),
                _planRow('Amount Paid', '₹${m['amount_paid']}'),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B),
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Opening membership renewal portal...')));
                    },
                    child: const Text('Renew / Upgrade Plan', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Recent Check-in Attendance History
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Recent Attendance Log', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                const SizedBox(height: 12),
                ...attendance.map((att) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(att['date'] as String, style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB))),
                          ),
                          Text('${att['time']} • ${att['type']}', style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                        ],
                      ),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Switch Role & Logout Actions
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.swap_horiz, color: Color(0xFF38BDF8)),
                  title: const Text('Switch to Owner Mode', style: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w700, fontSize: 14)),
                  subtitle: const Text('Access full gym management dashboard', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF)),
                  onTap: () => context.go('/owner/dashboard'),
                ),
                const Divider(color: Color(0xFF1F2937), height: 1),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.logout, color: Color(0xFFEF4444)),
                  title: const Text('Sign Out', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.w700, fontSize: 14)),
                  onTap: () async {
                    await auth.logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  Widget _metricCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1A2235),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF1F2937)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFFF59E0B), size: 18),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 9, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _planRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFF9FAFB))),
        ],
      ),
    );
  }
}
