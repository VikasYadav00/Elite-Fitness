import 'package:flutter/material.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';

class TrainersScreen extends StatefulWidget {
  const TrainersScreen({super.key});

  @override
  State<TrainersScreen> createState() => _TrainersScreenState();
}

class _TrainersScreenState extends State<TrainersScreen> {
  bool _isLoading = true;
  List<dynamic> _trainers = [];

  @override
  void initState() {
    super.initState();
    _fetchTrainers();
  }

  Future<void> _fetchTrainers() async {
    setState(() => _isLoading = true);

    try {
      final res = await ApiService.getTrainers();
      if (res['success'] == true && res['data'] != null) {
        setState(() {
          _trainers = res['data'] as List<dynamic>;
          _isLoading = false;
        });
        return;
      }
    } catch (_) {}

    setState(() {
      _trainers = [
        {
          'id': '1',
          'name': 'Vikram Rathore',
          'specialization': 'Strength & Bodybuilding',
          'phone': '+91 98765 43210',
          'email': 'vikram@elitefitness.com',
          'experience': '6 Years',
          'assigned_members': 18,
          'rating': 4.9,
          'is_active': true,
        },
        {
          'id': '2',
          'name': 'Ananya Sen',
          'specialization': 'HIIT & Weight Loss',
          'phone': '+91 98123 45678',
          'email': 'ananya@elitefitness.com',
          'experience': '4 Years',
          'assigned_members': 24,
          'rating': 4.8,
          'is_active': true,
        },
        {
          'id': '3',
          'name': 'Karan Malhotra',
          'specialization': 'CrossFit & Mobility',
          'phone': '+91 99887 76655',
          'email': 'karan@elitefitness.com',
          'experience': '5 Years',
          'assigned_members': 14,
          'rating': 4.7,
          'is_active': true,
        },
      ];
      _isLoading = false;
    });
  }

  void _showAddTrainerModal() {
    final nameCtrl = TextEditingController();
    final specCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final expCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Add Fitness Trainer', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  IconButton(icon: const Icon(Icons.close, color: Color(0xFF9CA3AF)), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),
              _buildField('Full Name', 'e.g. Sameer Kapoor', nameCtrl),
              const SizedBox(height: 12),
              _buildField('Specialization', 'e.g. Strength Training, Yoga', specCtrl),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildField('Phone', '9876543210', phoneCtrl, isPhone: true)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildField('Experience', '3 Years', expCtrl)),
                ],
              ),
              const SizedBox(height: 12),
              _buildField('Email Address', 'sameer@gym.com', emailCtrl),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  onPressed: () async {
                    if (nameCtrl.text.isEmpty) return;
                    final newTrainer = {
                      'id': DateTime.now().millisecondsSinceEpoch.toString(),
                      'name': nameCtrl.text.trim(),
                      'specialization': specCtrl.text.trim(),
                      'phone': phoneCtrl.text.trim(),
                      'email': emailCtrl.text.trim(),
                      'experience': expCtrl.text.trim(),
                      'assigned_members': 0,
                      'rating': 5.0,
                      'is_active': true,
                    };

                    try {
                      await ApiService.createTrainer(newTrainer);
                    } catch (_) {}

                    setState(() => _trainers.add(newTrainer));
                    if (mounted) Navigator.pop(ctx);
                  },
                  child: const Text('Save Trainer', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF59E0B),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add),
        label: const Text('Add Trainer', style: TextStyle(fontWeight: FontWeight.w800)),
        onPressed: _showAddTrainerModal,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchTrainers,
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
                          const Text('Gym Trainers', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                          const SizedBox(height: 4),
                          Text('${_trainers.length} certified fitness coaches', style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(12)),
                        child: const Icon(Icons.fitness_center, color: Color(0xFFF59E0B), size: 20),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  ..._trainers.map((trainer) => _buildTrainerCard(trainer)),
                  const SizedBox(height: 80),
                ],
              ),
      ),
    );
  }

  Widget _buildTrainerCard(Map<String, dynamic> trainer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassCard(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: const Color(0xFFF59E0B).withOpacity(0.2),
                  child: Text(
                    trainer['name'] != null && trainer['name'].toString().isNotEmpty
                        ? trainer['name'].toString().substring(0, 1).toUpperCase()
                        : 'T',
                    style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              trainer['name'] ?? 'Trainer',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 16),
                          Text('${trainer['rating'] ?? 5.0}', style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 12, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(trainer['specialization'] ?? 'Fitness Coach', style: const TextStyle(fontSize: 12, color: Color(0xFFF59E0B))),
                      const SizedBox(height: 2),
                      Text('${trainer['experience'] ?? '3+ Years'} • ${trainer['assigned_members'] ?? 0} Clients Assigned', style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(color: Color(0xFF1F2937), height: 1),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFD1D5DB),
                      side: const BorderSide(color: Color(0xFF374151)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.phone, size: 15, color: Color(0xFF10B981)),
                    label: const Text('Call', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Calling ${trainer['phone']}')));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1F2937),
                      foregroundColor: const Color(0xFFF59E0B),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.person_add_alt_1, size: 15),
                    label: const Text('Assign Member', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Assigning member to ${trainer['name']}')));
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
