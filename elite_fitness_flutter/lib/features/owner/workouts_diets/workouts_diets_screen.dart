import 'package:flutter/material.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';

class WorkoutsDietsScreen extends StatefulWidget {
  const WorkoutsDietsScreen({super.key});

  @override
  State<WorkoutsDietsScreen> createState() => _WorkoutsDietsScreenState();
}

class _WorkoutsDietsScreenState extends State<WorkoutsDietsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<dynamic> _workouts = [];
  List<dynamic> _diets = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final wRes = await ApiService.getWorkouts();
      if (wRes['success'] == true && wRes['data'] != null) {
        _workouts = wRes['data'] as List<dynamic>;
      }
    } catch (_) {}

    try {
      final dRes = await ApiService.getDiets();
      if (dRes['success'] == true && dRes['data'] != null) {
        _diets = dRes['data'] as List<dynamic>;
      }
    } catch (_) {}

    if (_workouts.isEmpty) {
      _workouts = [
        {
          'id': 'w1',
          'title': '4-Day Push Pull Legs (PPL)',
          'level': 'Intermediate',
          'duration': '8 Weeks',
          'target': 'Muscle Hypertrophy',
          'exercises_count': 18,
          'exercises': [
            {'name': 'Barbell Bench Press', 'sets': 4, 'reps': '8-10', 'target': 'Chest'},
            {'name': 'Incline Dumbbell Press', 'sets': 3, 'reps': '10-12', 'target': 'Upper Chest'},
            {'name': 'Standing Overhead Press', 'sets': 4, 'reps': '8-10', 'target': 'Shoulders'},
            {'name': 'Triceps Rope Pushdown', 'sets': 3, 'reps': '12-15', 'target': 'Triceps'},
          ],
        },
        {
          'id': 'w2',
          'title': 'Fat Shredder & HIIT Routine',
          'level': 'Beginner / All',
          'duration': '6 Weeks',
          'target': 'Calorie Burn & Conditioning',
          'exercises_count': 14,
          'exercises': [
            {'name': 'Kettlebell Swings', 'sets': 4, 'reps': '20', 'target': 'Full Body'},
            {'name': 'Burpees', 'sets': 3, 'reps': '15', 'target': 'Cardio / Core'},
            {'name': 'Battle Ropes', 'sets': 4, 'reps': '30s', 'target': 'Conditioning'},
            {'name': 'Box Jumps', 'sets': 3, 'reps': '12', 'target': 'Explosiveness'},
          ],
        },
        {
          'id': 'w3',
          'title': 'Beginner Full Body Strength',
          'level': 'Beginner',
          'duration': '4 Weeks',
          'target': 'Foundational Strength',
          'exercises_count': 10,
          'exercises': [
            {'name': 'Goblet Squat', 'sets': 3, 'reps': '10', 'target': 'Quads & Glutes'},
            {'name': 'Lat Pulldown', 'sets': 3, 'reps': '12', 'target': 'Back'},
            {'name': 'Dumbbell Chest Press', 'sets': 3, 'reps': '10', 'target': 'Chest'},
            {'name': 'Plank Hold', 'sets': 3, 'reps': '45s', 'target': 'Core'},
          ],
        },
      ];
    }

    if (_diets.isEmpty) {
      _diets = [
        {
          'id': 'd1',
          'title': 'High Protein Clean Muscle Gain',
          'calories': '2,800 kcal',
          'protein': '180g',
          'carbs': '310g',
          'fats': '70g',
          'type': 'Non-Veg / High Protein',
          'meals': [
            {'time': 'Breakfast (8:00 AM)', 'menu': '4 Egg whites + 2 whole eggs, 2 slices brown bread, 1 banana'},
            {'time': 'Mid-Morning (11:00 AM)', 'menu': 'Whey protein shake with 300ml almond milk + 15 almonds'},
            {'time': 'Lunch (1:30 PM)', 'menu': '200g Grilled chicken breast, 1 bowl brown rice, green salad'},
            {'time': 'Dinner (8:30 PM)', 'menu': '150g Paneer/Fish, mixed steamed vegetables, 1 multigrain roti'},
          ],
        },
        {
          'id': 'd2',
          'title': 'Vegetarian Fat Loss & Lean Fit',
          'calories': '1,750 kcal',
          'protein': '120g',
          'carbs': '160g',
          'fats': '45g',
          'type': 'Vegetarian',
          'meals': [
            {'time': 'Breakfast (8:00 AM)', 'menu': 'Oatmeal with chia seeds, scoop of plant protein, berries'},
            {'time': 'Lunch (1:30 PM)', 'menu': '150g Tofu / Low-fat paneer, 1 cup quinoa/dal, cucumber cucumber salad'},
            {'time': 'Snack (5:00 PM)', 'menu': 'Roasted chana, green tea, handful of walnuts'},
            {'time': 'Dinner (8:00 PM)', 'menu': 'Sprouts salad with lemon dressing, soup bowl, 1 roti'},
          ],
        },
      ];
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF59E0B),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add),
        label: Text(_tabController.index == 0 ? 'New Workout' : 'New Diet', style: const TextStyle(fontWeight: FontWeight.w800)),
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Create ${_tabController.index == 0 ? 'Workout' : 'Diet'} template dialog')),
          );
        },
      ),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Workouts & Nutrition', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  const SizedBox(height: 4),
                  const Text('Manage training routines & nutrition charts', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(color: const Color(0xFF111827), borderRadius: BorderRadius.circular(12)),
                    child: TabBar(
                      controller: _tabController,
                      indicatorColor: const Color(0xFFF59E0B),
                      indicatorWeight: 3,
                      labelColor: const Color(0xFFF59E0B),
                      unselectedLabelColor: const Color(0xFF9CA3AF),
                      labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                      tabs: const [
                        Tab(icon: Icon(Icons.fitness_center, size: 18), text: 'Workout Plans'),
                        Tab(icon: Icon(Icons.restaurant_menu, size: 18), text: 'Diet Plans'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFF59E0B)))
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildWorkoutsList(),
                  _buildDietsList(),
                ],
              ),
      ),
    );
  }

  Widget _buildWorkoutsList() {
    return ListView.builder(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80),
      itemCount: _workouts.length,
      itemBuilder: (context, index) {
        final w = _workouts[index];
        final exercises = w['exercises'] as List? ?? [];

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          child: GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        w['title'] ?? 'Workout Plan',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.4)),
                      ),
                      child: Text(
                        w['level'] ?? 'All Levels',
                        style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 10, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  '${w['target']} • ${w['duration']} • ${w['exercises_count']} Exercises',
                  style: const TextStyle(fontSize: 12, color: Color(0xFFF59E0B)),
                ),
                const SizedBox(height: 14),
                const Text('Sample Routine:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 8),
                ...exercises.take(3).map((ex) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          const Icon(Icons.arrow_right, color: Color(0xFFF59E0B), size: 16),
                          Expanded(
                            child: Text(
                              ex['name'] ?? '',
                              style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB)),
                            ),
                          ),
                          Text(
                            '${ex['sets']} sets × ${ex['reps']}',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    )),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1F2937),
                      foregroundColor: const Color(0xFFF59E0B),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.person_add_alt_1, size: 15),
                    label: const Text('Assign To Member', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Assigning ${w['title']} to member')));
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDietsList() {
    return ListView.builder(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80),
      itemCount: _diets.length,
      itemBuilder: (context, index) {
        final d = _diets[index];
        final meals = d['meals'] as List? ?? [];

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          child: GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        d['title'] ?? 'Diet Plan',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                      ),
                      child: Text(
                        d['calories'] ?? '2000 kcal',
                        style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(d['type'] ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _macroChip('Protein', d['protein'] ?? '150g', const Color(0xFF3B82F6)),
                    const SizedBox(width: 8),
                    _macroChip('Carbs', d['carbs'] ?? '250g', const Color(0xFFF59E0B)),
                    const SizedBox(width: 8),
                    _macroChip('Fats', d['fats'] ?? '60g', const Color(0xFFEF4444)),
                  ],
                ),
                const SizedBox(height: 14),
                const Text('Daily Meals:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 8),
                ...meals.take(2).map((m) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m['time'] ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFF59E0B))),
                          const SizedBox(height: 2),
                          Text(m['menu'] ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFFD1D5DB))),
                        ],
                      ),
                    )),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1F2937),
                      foregroundColor: const Color(0xFF10B981),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.person_add_alt_1, size: 15),
                    label: const Text('Assign Diet Plan', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Assigning ${d['title']} to member')));
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _macroChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text('$label: $value', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}
