import 'package:flutter/material.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  bool _isLoading = true;
  List<dynamic> _plans = [];

  @override
  void initState() {
    super.initState();
    _fetchPlans();
  }

  Future<void> _fetchPlans() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final res = await ApiService.getPlans();
      if (res['success'] == true && res['data'] != null) {
        setState(() {
          _plans = res['data'] as List<dynamic>;
          _isLoading = false;
        });
        return;
      }
    } catch (_) {}

    // Fallback default plans
    setState(() {
      _plans = [
        {
          'id': '1',
          'name': 'Monthly Standard',
          'duration_months': 1,
          'price': 1500,
          'description': 'Full gym access, locker facility, general trainer assistance.',
          'features': ['Gym Floor Access', 'Locker Room', 'Trainer Support', 'Free Wi-Fi'],
          'is_popular': false,
          'is_active': true,
        },
        {
          'id': '2',
          'name': 'Quarterly Pro',
          'duration_months': 3,
          'price': 3800,
          'description': 'Our most popular plan. Access to cardio, weights & steam bath.',
          'features': ['All Standard Perks', 'Steam Bath (Weekly)', '1 PT Session/Month', 'Diet Consultation'],
          'is_popular': true,
          'is_active': true,
        },
        {
          'id': '3',
          'name': 'Annual VIP Elite',
          'duration_months': 12,
          'price': 12000,
          'description': 'Unrestricted VIP access with personalized workout & diet plan.',
          'features': ['24/7 Access', 'Unlimited Steam/Sauna', 'Personal Trainer Assigned', 'Free Gym Merch', 'Custom Diet Program'],
          'is_popular': false,
          'is_active': true,
        },
      ];
      _isLoading = false;
    });
  }

  void _showAddPlanModal() {
    final nameCtrl = TextEditingController();
    final durationCtrl = TextEditingController(text: '1');
    final priceCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final featuresCtrl = TextEditingController();
    bool isPopular = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Create Membership Plan',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF9CA3AF)),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField('Plan Name', 'e.g. 6 Months Muscle Builder', nameCtrl),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildTextField('Duration (Months)', '3', durationCtrl, isNumber: true)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildTextField('Price (₹)', '4500', priceCtrl, isNumber: true)),
                  ],
                ),
                const SizedBox(height: 12),
                _buildTextField('Description', 'Short plan description', descCtrl, maxLines: 2),
                const SizedBox(height: 12),
                _buildTextField('Features (Comma separated)', 'Cardio, Weights, Diet chart', featuresCtrl),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Checkbox(
                      value: isPopular,
                      activeColor: const Color(0xFFF59E0B),
                      onChanged: (val) => setModalState(() => isPopular = val ?? false),
                    ),
                    const Text('Mark as "Popular Plan"', style: TextStyle(color: Color(0xFFD1D5DB), fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B),
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () async {
                      if (nameCtrl.text.isEmpty || priceCtrl.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please fill plan name and price')),
                        );
                        return;
                      }

                      final newPlan = {
                        'id': DateTime.now().millisecondsSinceEpoch.toString(),
                        'name': nameCtrl.text.trim(),
                        'duration_months': int.tryParse(durationCtrl.text) ?? 1,
                        'price': double.tryParse(priceCtrl.text) ?? 0,
                        'description': descCtrl.text.trim(),
                        'features': featuresCtrl.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
                        'is_popular': isPopular,
                        'is_active': true,
                      };

                      try {
                        await ApiService.createPlan(newPlan);
                      } catch (_) {}

                      setState(() => _plans.add(newPlan));
                      if (mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Plan created successfully!'), backgroundColor: Color(0xFF10B981)),
                        );
                      }
                    },
                    child: const Text('Save Plan', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, String hint, TextEditingController ctrl, {bool isNumber = false, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          maxLines: maxLines,
          style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
            filled: true,
            fillColor: const Color(0xFF1F2937),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFF59E0B))),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF59E0B),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add),
        label: const Text('New Plan', style: TextStyle(fontWeight: FontWeight.w800)),
        onPressed: _showAddPlanModal,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchPlans,
        color: const Color(0xFFF59E0B),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFF59E0B)))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Membership Plans',
                            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_plans.length} active packages configured',
                            style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1F2937),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${_plans.length} Plans',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFF59E0B)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ..._plans.map((plan) => _buildPlanCard(plan)),
                  const SizedBox(height: 80),
                ],
              ),
      ),
    );
  }

  Widget _buildPlanCard(Map<String, dynamic> plan) {
    final isPopular = plan['is_popular'] == true;
    final List features = plan['features'] is List ? plan['features'] as List : [];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassCard(
        borderColor: isPopular ? const Color(0xFFF59E0B).withOpacity(0.6) : null,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (isPopular)
                        Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'POPULAR',
                            style: TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                          ),
                        ),
                      Text(
                        plan['name'] ?? 'Plan',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${plan['duration_months'] ?? 1} Month${(plan['duration_months'] ?? 1) > 1 ? 's' : ''} Duration',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹${plan['price'] ?? 0}',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFFF59E0B)),
                    ),
                    Text(
                      '/ ${(plan['duration_months'] ?? 1)} mo',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ],
            ),
            if (plan['description'] != null && plan['description'].toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                plan['description'],
                style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB)),
              ),
            ],
            const SizedBox(height: 16),
            const Divider(color: Color(0xFF1F2937), height: 1),
            const SizedBox(height: 14),
            ...features.map((feat) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          feat.toString(),
                          style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
