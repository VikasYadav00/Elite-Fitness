import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/widgets/glass_card.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _gymNameCtrl = TextEditingController(text: 'Elite Fitness Club');
  final _addressCtrl = TextEditingController(text: 'Plot 42, Fitness Avenue, Sector 15');
  final _phoneCtrl = TextEditingController(text: '+91 98765 00001');
  final _gstCtrl = TextEditingController(text: '07AAAAA0000A1Z5');

  bool _whatsappAlerts = true;
  bool _expiryReminders = true;
  bool _attendanceNotif = false;

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Gym Settings', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
          const SizedBox(height: 4),
          const Text('Configure gym profile, alerts & preferences', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 20),
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.business, color: Color(0xFFF59E0B), size: 20),
                    SizedBox(width: 8),
                    Text('Gym Business Profile', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  ],
                ),
                const SizedBox(height: 16),
                _buildField('Gym / Brand Name', _gymNameCtrl),
                const SizedBox(height: 12),
                _buildField('Physical Address', _addressCtrl),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildField('Support Phone', _phoneCtrl)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildField('GST Number', _gstCtrl)),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1F2937),
                      foregroundColor: const Color(0xFFF59E0B),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Gym profile saved!'), backgroundColor: Color(0xFF10B981)),
                      );
                    },
                    child: const Text('Save Profile Details', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.notifications_active, color: Color(0xFFF59E0B), size: 20),
                    SizedBox(width: 8),
                    Text('Automated Alerts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  ],
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('WhatsApp Notifications', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFFF9FAFB))),
                  subtitle: const Text('Send fee receipts & welcome messages', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                  value: _whatsappAlerts,
                  activeColor: const Color(0xFFF59E0B),
                  onChanged: (v) => setState(() => _whatsappAlerts = v),
                ),
                const Divider(color: Color(0xFF1F2937), height: 1),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Expiry Reminders', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFFF9FAFB))),
                  subtitle: const Text('Alert members 7, 3, and 1 day before expiry', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                  value: _expiryReminders,
                  activeColor: const Color(0xFFF59E0B),
                  onChanged: (v) => setState(() => _expiryReminders = v),
                ),
                const Divider(color: Color(0xFF1F2937), height: 1),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Daily Attendance Summary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFFF9FAFB))),
                  subtitle: const Text('Receive end-of-day attendance report on SMS', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                  value: _attendanceNotif,
                  activeColor: const Color(0xFFF59E0B),
                  onChanged: (v) => setState(() => _attendanceNotif = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.swap_horiz, color: Color(0xFF38BDF8), size: 20),
                    SizedBox(width: 8),
                    Text('Role & Preview Switcher', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'Switch to Member mode to test workout routines, meal plans & QR pass as an active gym customer.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF38BDF8).withOpacity(0.2),
                      foregroundColor: const Color(0xFF38BDF8),
                      side: const BorderSide(color: Color(0xFF38BDF8)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.phone_android, size: 18),
                    label: const Text('Switch To Customer View', style: TextStyle(fontWeight: FontWeight.w800)),
                    onPressed: () {
                      context.go('/member/home');
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444).withOpacity(0.15),
                foregroundColor: const Color(0xFFEF4444),
                side: const BorderSide(color: Color(0xFFEF4444)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('Log Out of Elite Fitness', style: TextStyle(fontWeight: FontWeight.w800)),
              onPressed: () async {
                await auth.logout();
                if (context.mounted) {
                  context.go('/login');
                }
              },
            ),
          ),
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  Widget _buildField(String label, TextEditingController ctrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFF1F2937),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }
}
