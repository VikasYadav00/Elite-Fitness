import 'package:flutter/material.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';

class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key});

  @override
  State<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  bool _isLoading = true;
  List<dynamic> _leads = [];
  String _selectedStatus = 'ALL';

  @override
  void initState() {
    super.initState();
    _fetchLeads();
  }

  Future<void> _fetchLeads() async {
    setState(() => _isLoading = true);

    try {
      final res = await ApiService.getLeads();
      if (res['success'] == true && res['data'] != null) {
        setState(() {
          _leads = res['data'] as List<dynamic>;
          _isLoading = false;
        });
        return;
      }
    } catch (_) {}

    setState(() {
      _leads = [
        {
          'id': '1',
          'name': 'Rohit Deshmukh',
          'phone': '+91 97654 12345',
          'source': 'Instagram Ad',
          'status': 'NEW',
          'interest': 'Weight Loss & Personal Training',
          'date': 'Today, 11:00 AM',
        },
        {
          'id': '2',
          'name': 'Sneha Kulkarni',
          'phone': '+91 98223 99881',
          'source': 'Walk-in',
          'status': 'TRIAL',
          'interest': '3 Months Membership Plan',
          'date': 'Yesterday',
        },
        {
          'id': '3',
          'name': 'Manish Jain',
          'phone': '+91 99112 33445',
          'source': 'Google Search',
          'status': 'CONTACTED',
          'interest': 'Annual Membership with Locker',
          'date': '17 Sep 2026',
        },
        {
          'id': '4',
          'name': 'Pooja Bhatt',
          'phone': '+91 98450 67890',
          'source': 'Friend Referral',
          'status': 'CONVERTED',
          'interest': 'Converted to Annual VIP',
          'date': '15 Sep 2026',
        },
      ];
      _isLoading = false;
    });
  }

  void _showAddLeadModal() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final interestCtrl = TextEditingController();
    String source = 'Instagram';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('New Lead Inquiry', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  IconButton(icon: const Icon(Icons.close, color: Color(0xFF9CA3AF)), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),
              _buildField('Full Name', 'e.g. Aman Sharma', nameCtrl),
              const SizedBox(height: 12),
              _buildField('Phone Number', '9876543210', phoneCtrl, isPhone: true),
              const SizedBox(height: 12),
              const Text('Source', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(10)),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: source,
                    dropdownColor: const Color(0xFF1F2937),
                    isExpanded: true,
                    style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
                    items: ['Instagram', 'Walk-in', 'Google Search', 'Friend Referral', 'Facebook', 'Other']
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (val) => setModalState(() => source = val!),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _buildField('Fitness Interest / Goal', 'e.g. Muscle gain, 6 months plan', interestCtrl),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  onPressed: () async {
                    if (nameCtrl.text.isEmpty || phoneCtrl.text.isEmpty) return;
                    final newLead = {
                      'id': DateTime.now().millisecondsSinceEpoch.toString(),
                      'name': nameCtrl.text.trim(),
                      'phone': phoneCtrl.text.trim(),
                      'source': source,
                      'status': 'NEW',
                      'interest': interestCtrl.text.trim(),
                      'date': 'Just now',
                    };
                    try {
                      await ApiService.addLead(newLead);
                    } catch (_) {}
                    setState(() => _leads.insert(0, newLead));
                    if (mounted) Navigator.pop(ctx);
                  },
                  child: const Text('Add Lead', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController ctrl, {bool isPhone = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
          style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
            filled: true,
            fillColor: const Color(0xFF1F2937),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'NEW':
        return const Color(0xFF3B82F6);
      case 'CONTACTED':
        return const Color(0xFFF59E0B);
      case 'TRIAL':
        return const Color(0xFF8B5CF6);
      case 'CONVERTED':
        return const Color(0xFF10B981);
      default:
        return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredLeads = _selectedStatus == 'ALL'
        ? _leads
        : _leads.where((l) => (l['status'] ?? '').toString().toUpperCase() == _selectedStatus).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF59E0B),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.person_add),
        label: const Text('New Lead', style: TextStyle(fontWeight: FontWeight.w800)),
        onPressed: _showAddLeadModal,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchLeads,
        color: const Color(0xFFF59E0B),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Leads & Inquiries CRM', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  const SizedBox(height: 4),
                  Text('${_leads.length} potential gym members in funnel', style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
                  const SizedBox(height: 14),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['ALL', 'NEW', 'CONTACTED', 'TRIAL', 'CONVERTED'].map((status) {
                        final isSel = _selectedStatus == status;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(status, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isSel ? Colors.black : const Color(0xFF9CA3AF))),
                            selected: isSel,
                            selectedColor: const Color(0xFFF59E0B),
                            backgroundColor: const Color(0xFF1F2937),
                            onSelected: (_) => setState(() => _selectedStatus = status),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFFF59E0B)))
                  : ListView.builder(
                      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80),
                      itemCount: filteredLeads.length,
                      itemBuilder: (context, index) {
                        final lead = filteredLeads[index];
                        final status = lead['status'] ?? 'NEW';
                        final color = _statusColor(status);

                        return Container(
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
                                        lead['name'] ?? 'Lead',
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: color.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: color.withOpacity(0.4)),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${lead['source']} • ${lead['date']}',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                                ),
                                if (lead['interest'] != null && lead['interest'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    'Goal: ${lead['interest']}',
                                    style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB)),
                                  ),
                                ],
                                const SizedBox(height: 14),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: const Color(0xFF10B981),
                                          side: const BorderSide(color: Color(0xFF10B981)),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                        ),
                                        icon: const Icon(Icons.phone, size: 14),
                                        label: const Text('Call', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                                        onPressed: () {
                                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Calling ${lead['phone']}')));
                                        },
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF10B981),
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                        ),
                                        icon: const Icon(Icons.check, size: 14),
                                        label: const Text('Convert', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                                        onPressed: () async {
                                          try {
                                            await ApiService.convertLead(lead['id']);
                                          } catch (_) {}
                                          setState(() => lead['status'] = 'CONVERTED');
                                          if (mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('${lead['name']} converted to Member!'), backgroundColor: const Color(0xFF10B981)),
                                            );
                                          }
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
