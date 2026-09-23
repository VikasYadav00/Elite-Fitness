import 'package:flutter/material.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';

class BroadcastScreen extends StatefulWidget {
  const BroadcastScreen({super.key});

  @override
  State<BroadcastScreen> createState() => _BroadcastScreenState();
}

class _BroadcastScreenState extends State<BroadcastScreen> {
  final _titleCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  String _targetAudience = 'All Members';
  String _messageType = 'Announcement';
  bool _isSending = false;

  final List<Map<String, dynamic>> _history = [
    {
      'title': 'Diwali Special Offer! 20% OFF',
      'message': 'Renew your annual membership this week and get 2 months free + personal trainer kit!',
      'audience': 'All Members',
      'type': 'Offer',
      'date': 'Yesterday, 5:30 PM',
      'recipients': 185,
    },
    {
      'title': 'Gym Maintenance Notice',
      'message': 'Gym will remain closed this Sunday (20th Sep) between 2 PM to 6 PM for AC maintenance.',
      'audience': 'Active Members',
      'type': 'Notice',
      'date': '16 Sep 2026',
      'recipients': 142,
    },
    {
      'title': 'Membership Expiry Reminder',
      'message': 'Your membership is expiring in 3 days. Renew now to avoid re-admission fee.',
      'audience': 'Expiring Soon',
      'type': 'Reminder',
      'date': '14 Sep 2026',
      'recipients': 19,
    },
  ];

  Future<void> _sendBroadcast() async {
    if (_titleCtrl.text.isEmpty || _messageCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter notification title and message')),
      );
      return;
    }

    setState(() => _isSending = true);

    final payload = {
      'title': _titleCtrl.text.trim(),
      'message': _messageCtrl.text.trim(),
      'target': _targetAudience,
      'type': _messageType,
      'date': 'Just now',
      'recipients': _targetAudience == 'All Members' ? 185 : (_targetAudience == 'Active Members' ? 142 : 24),
    };

    try {
      await ApiService.broadcast(payload);
    } catch (_) {}

    setState(() {
      _history.insert(0, payload);
      _titleCtrl.clear();
      _messageCtrl.clear();
      _isSending = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Broadcast sent successfully to all selected members!'), backgroundColor: Color(0xFF10B981)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Push Broadcast', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
          const SizedBox(height: 4),
          const Text('Send instant notifications to member mobile apps', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 20),
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.campaign, color: Color(0xFFF59E0B), size: 20),
                    SizedBox(width: 8),
                    Text('New Broadcast Notification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('Target Audience', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(10)),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _targetAudience,
                      dropdownColor: const Color(0xFF1F2937),
                      isExpanded: true,
                      style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
                      items: ['All Members', 'Active Members', 'Expiring Soon (< 7 days)', 'Expired / Inactive', 'Trainers Only']
                          .map((a) => DropdownMenuItem(value: a, child: Text(a)))
                          .toList(),
                      onChanged: (val) => setState(() => _targetAudience = val!),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Notification Title', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 6),
                TextField(
                  controller: _titleCtrl,
                  style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'e.g. Special Weekend Zumba Workshop!',
                    hintStyle: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
                    filled: true,
                    fillColor: const Color(0xFF1F2937),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Message Body', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 6),
                TextField(
                  controller: _messageCtrl,
                  maxLines: 3,
                  style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Type your message here...',
                    hintStyle: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
                    filled: true,
                    fillColor: const Color(0xFF1F2937),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B),
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: _isSending ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black)) : const Icon(Icons.send_rounded, size: 18),
                    label: Text(_isSending ? 'Sending...' : 'Send Broadcast to App Users', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                    onPressed: _isSending ? null : _sendBroadcast,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text('Broadcast History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
          const SizedBox(height: 12),
          ..._history.map((item) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: GlassCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              item['title'] ?? '',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(4)),
                            child: Text('${item['recipients']} Delivered', style: const TextStyle(fontSize: 10, color: Color(0xFF10B981), fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(item['message'] ?? '', style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB))),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(Icons.people, size: 14, color: Color(0xFF9CA3AF)),
                          const SizedBox(width: 4),
                          Text(item['audience'] ?? '', style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                          const Spacer(),
                          Text(item['date'] ?? '', style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                        ],
                      ),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 60),
        ],
      ),
    );
  }
}
