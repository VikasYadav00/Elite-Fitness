import 'package:flutter/material.dart';
import '../../../core/widgets/glass_card.dart';

class MemberDietScreen extends StatefulWidget {
  const MemberDietScreen({super.key});

  @override
  State<MemberDietScreen> createState() => _MemberDietScreenState();
}

class _MemberDietScreenState extends State<MemberDietScreen> {
  final List<Map<String, dynamic>> _meals = [
    {
      'title': 'Breakfast',
      'time': '8:00 AM',
      'calories': 550,
      'is_eaten': true,
      'items': [
        '4 Egg Whites + 2 Whole Eggs Omelet',
        '2 Slices Whole Grain Toast',
        '1 Medium Banana',
        'Green Tea with Lemon',
      ],
    },
    {
      'title': 'Morning Snack',
      'time': '11:00 AM',
      'calories': 280,
      'is_eaten': true,
      'items': [
        '1 Scoop Whey Isolate in 300ml Almond Milk',
        'Handful of California Almonds (15g)',
      ],
    },
    {
      'title': 'Lunch',
      'time': '1:30 PM',
      'calories': 720,
      'is_eaten': false,
      'items': [
        '200g Grilled Chicken Breast or Low-Fat Paneer',
        '1 Cup Steamed Brown Rice or 2 Multigrain Rotis',
        '1 Bowl Yellow Dal Tadka',
        'Fresh Cucumber & Tomato Salad with Olive Oil',
      ],
    },
    {
      'title': 'Pre-Workout Fuel',
      'time': '5:00 PM',
      'calories': 250,
      'is_eaten': false,
      'items': [
        '1 Rice Cake with Peanut Butter',
        '1 Black Coffee (Double Shot)',
      ],
    },
    {
      'title': 'Dinner',
      'time': '8:30 PM',
      'calories': 600,
      'is_eaten': false,
      'items': [
        '180g Baked Salmon / Soya Chunks Curry',
        'Steamed Broccoli & Mixed Bell Peppers',
        '1 Multigrain Roti',
      ],
    },
  ];

  @override
  Widget build(BuildContext context) {
    int consumedCalories = 0;
    for (final m in _meals) {
      if (m['is_eaten'] == true) {
        consumedCalories += (m['calories'] as int);
      }
    }
    final targetCalories = 2400;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Nutrition & Meal Plan', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
          const SizedBox(height: 4),
          const Text('Custom diet chart prescribed by Coach Vikram', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 16),

          // Calorie Target Card
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('DAILY CALORIC GOAL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF))),
                        const SizedBox(height: 4),
                        Text('$consumedCalories / $targetCalories kcal', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.15), shape: BoxShape.circle),
                      child: const Icon(Icons.restaurant, color: Color(0xFF10B981), size: 24),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: consumedCalories / targetCalories,
                    minHeight: 10,
                    backgroundColor: const Color(0xFF1F2937),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _macroBar('Protein', '110 / 165g', 0.66, const Color(0xFF3B82F6)),
                    const SizedBox(width: 12),
                    _macroBar('Carbs', '140 / 260g', 0.53, const Color(0xFFF59E0B)),
                    const SizedBox(width: 12),
                    _macroBar('Fats', '35 / 65g', 0.53, const Color(0xFFEF4444)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Meals Breakdown
          const Text("Today's Meals", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
          const SizedBox(height: 12),
          ..._meals.map((meal) {
            final isEaten = meal['is_eaten'] == true;
            final List items = meal['items'] as List;

            return Container(
              margin: const EdgeInsets.only(bottom: 14),
              child: GlassCard(
                padding: const EdgeInsets.all(16),
                borderColor: isEaten ? const Color(0xFF10B981).withOpacity(0.4) : null,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  meal['title'] as String,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '• ${meal['time']}',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${meal['calories']} Calories',
                              style: const TextStyle(fontSize: 12, color: Color(0xFFF59E0B), fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        InkWell(
                          onTap: () {
                            setState(() {
                              meal['is_eaten'] = !isEaten;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isEaten ? const Color(0xFF10B981) : const Color(0xFF1F2937),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: isEaten ? const Color(0xFF10B981) : const Color(0xFF374151)),
                            ),
                            child: Row(
                              children: [
                                Icon(isEaten ? Icons.check : Icons.radio_button_unchecked, size: 14, color: isEaten ? Colors.black : const Color(0xFF9CA3AF)),
                                const SizedBox(width: 4),
                                Text(
                                  isEaten ? 'Eaten' : 'Mark Eaten',
                                  style: TextStyle(
                                    color: isEaten ? Colors.black : const Color(0xFF9CA3AF),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(color: Color(0xFF1F2937), height: 1),
                    const SizedBox(height: 10),
                    ...items.map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 4, right: 8),
                                child: Icon(Icons.circle, size: 6, color: Color(0xFFF59E0B)),
                              ),
                              Expanded(
                                child: Text(
                                  item.toString(),
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isEaten ? const Color(0xFF6B7280) : const Color(0xFFD1D5DB),
                                    decoration: isEaten ? TextDecoration.lineThrough : null,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  Widget _macroBar(String label, String value, double progress, Color color) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: const Color(0xFF1F2937),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}
