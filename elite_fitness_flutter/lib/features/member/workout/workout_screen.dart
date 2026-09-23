import 'package:flutter/material.dart';
import '../../../core/widgets/glass_card.dart';

class MemberWorkoutScreen extends StatefulWidget {
  const MemberWorkoutScreen({super.key});

  @override
  State<MemberWorkoutScreen> createState() => _MemberWorkoutScreenState();
}

class _MemberWorkoutScreenState extends State<MemberWorkoutScreen> {
  int _selectedDayIndex = 0;
  final List<String> _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  final Map<int, Map<String, dynamic>> _routineData = {
    0: {
      'title': 'Chest & Triceps Power',
      'duration': '50 mins',
      'burn': '~380 kcal',
      'exercises': [
        {'name': 'Barbell Flat Bench Press', 'target': 'Middle Chest', 'sets': 4, 'reps': '8-10', 'weight': '75 kg', 'done': [false, false, false, false]},
        {'name': 'Incline Dumbbell Press', 'target': 'Upper Chest', 'sets': 3, 'reps': '10-12', 'weight': '24 kg', 'done': [false, false, false]},
        {'name': 'Pec Deck Fly Machine', 'target': 'Chest Isolation', 'sets': 3, 'reps': '12-15', 'weight': '45 kg', 'done': [false, false, false]},
        {'name': 'Cable Rope Tricep Extension', 'target': 'Triceps Lateral', 'sets': 4, 'reps': '12-15', 'weight': '25 kg', 'done': [false, false, false, false]},
        {'name': 'Overhead Dumbbell Extension', 'target': 'Triceps Long Head', 'sets': 3, 'reps': '10-12', 'weight': '18 kg', 'done': [false, false, false]},
      ]
    },
    1: {
      'title': 'Back & Biceps Pull Day',
      'duration': '55 mins',
      'burn': '~420 kcal',
      'exercises': [
        {'name': 'Wide-Grip Lat Pulldown', 'target': 'Lats', 'sets': 4, 'reps': '10-12', 'weight': '55 kg', 'done': [false, false, false, false]},
        {'name': 'Seated Cable Row', 'target': 'Mid Back', 'sets': 3, 'reps': '10-12', 'weight': '50 kg', 'done': [false, false, false]},
        {'name': 'Barbell Deadlifts', 'target': 'Posterior Chain', 'sets': 3, 'reps': '6-8', 'weight': '100 kg', 'done': [false, false, false]},
        {'name': 'Barbell Bicep Curls', 'target': 'Biceps Brachii', 'sets': 4, 'reps': '10-12', 'weight': '25 kg', 'done': [false, false, false, false]},
        {'name': 'Hammer Curls with Dumbbells', 'target': 'Brachialis & Forearms', 'sets': 3, 'reps': '12-15', 'weight': '14 kg', 'done': [false, false, false]},
      ]
    },
    2: {
      'title': 'Legs & Core Conditioning',
      'duration': '60 mins',
      'burn': '~500 kcal',
      'exercises': [
        {'name': 'Barbell Back Squats', 'target': 'Quadriceps & Glutes', 'sets': 4, 'reps': '8-10', 'weight': '80 kg', 'done': [false, false, false, false]},
        {'name': 'Leg Press Machine', 'target': 'Quads', 'sets': 3, 'reps': '12', 'weight': '140 kg', 'done': [false, false, false]},
        {'name': 'Lying Hamstring Curls', 'target': 'Hamstrings', 'sets': 3, 'reps': '12-15', 'weight': '35 kg', 'done': [false, false, false]},
        {'name': 'Standing Calf Raises', 'target': 'Calves', 'sets': 4, 'reps': '20', 'weight': '50 kg', 'done': [false, false, false, false]},
        {'name': 'Hanging Knee Raises', 'target': 'Lower Abs', 'sets': 3, 'reps': '15', 'weight': 'Bodyweight', 'done': [false, false, false]},
      ]
    },
    3: {
      'title': 'Shoulders & Traps Boulder Day',
      'duration': '45 mins',
      'burn': '~350 kcal',
      'exercises': [
        {'name': 'Overhead Barbell Press', 'target': 'Anterior Deltoid', 'sets': 4, 'reps': '8-10', 'weight': '40 kg', 'done': [false, false, false, false]},
        {'name': 'Dumbbell Lateral Raises', 'target': 'Lateral Deltoid', 'sets': 4, 'reps': '15', 'weight': '10 kg', 'done': [false, false, false, false]},
        {'name': 'Reverse Pec Deck Fly', 'target': 'Rear Deltoid', 'sets': 3, 'reps': '15', 'weight': '30 kg', 'done': [false, false, false]},
        {'name': 'Dumbbell Shrugs', 'target': 'Trapezius', 'sets': 4, 'reps': '12-15', 'weight': '28 kg', 'done': [false, false, false, false]},
      ]
    },
    4: {
      'title': 'Full Body Functional & Core',
      'duration': '45 mins',
      'burn': '~450 kcal',
      'exercises': [
        {'name': 'Kettlebell Goblet Squats', 'target': 'Lower Body', 'sets': 3, 'reps': '15', 'weight': '20 kg', 'done': [false, false, false]},
        {'name': 'Pushups to Renegade Row', 'target': 'Upper & Core', 'sets': 3, 'reps': '10', 'weight': '10 kg', 'done': [false, false, false]},
        {'name': 'Battle Ropes Waves', 'target': 'Cardio / Arms', 'sets': 4, 'reps': '30s', 'weight': '-', 'done': [false, false, false, false]},
        {'name': 'Plank Hold', 'target': 'Core Endurance', 'sets': 3, 'reps': '60s', 'weight': '-', 'done': [false, false, false]},
      ]
    },
    5: {
      'title': 'Active Recovery & Stretching',
      'duration': '30 mins',
      'burn': '~150 kcal',
      'exercises': [
        {'name': 'Foam Rolling Major Muscles', 'target': 'Myofascial Release', 'sets': 1, 'reps': '10 mins', 'weight': '-', 'done': [false]},
        {'name': 'Dynamic Hamstring & Hip Stretch', 'target': 'Mobility', 'sets': 3, 'reps': '45s', 'weight': '-', 'done': [false, false, false]},
        {'name': 'Incline Treadmill Walk', 'target': 'Low Impact Cardio', 'sets': 1, 'reps': '20 mins', 'weight': '-', 'done': [false]},
      ]
    },
  };

  @override
  Widget build(BuildContext context) {
    final routine = _routineData[_selectedDayIndex] ?? _routineData[0]!;
    final List exercises = routine['exercises'] as List;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Workout Program', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
          const SizedBox(height: 4),
          const Text('Custom program assigned by Coach Vikram', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 16),

          // Day Selector Pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(_days.length, (idx) {
                final isSel = _selectedDayIndex == idx;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(_days[idx], style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: isSel ? Colors.black : const Color(0xFF9CA3AF))),
                    selected: isSel,
                    selectedColor: const Color(0xFFF59E0B),
                    backgroundColor: const Color(0xFF1F2937),
                    onSelected: (_) => setState(() => _selectedDayIndex = idx),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 16),

          // Workout Overview Card
          GlassCard(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E293B), Color(0xFF111827)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        routine['title'] as String,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                      child: Text('${exercises.length} Exercises', style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 11, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.timer_outlined, size: 15, color: Color(0xFF9CA3AF)),
                    const SizedBox(width: 4),
                    Text(routine['duration'] as String, style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                    const SizedBox(width: 14),
                    const Icon(Icons.local_fire_department, size: 15, color: Color(0xFFF97316)),
                    const SizedBox(width: 4),
                    Text(routine['burn'] as String, style: const TextStyle(fontSize: 12, color: Color(0xFFF97316), fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Exercises List
          ...exercises.map((ex) => Container(
                margin: const EdgeInsets.only(bottom: 14),
                child: GlassCard(
                  padding: const EdgeInsets.all(16),
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
                                Text(
                                  ex['name'] as String,
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'Target: ${ex['target']} • Weight: ${ex['weight']}',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFFF59E0B)),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '${ex['sets']} × ${ex['reps']}',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(color: Color(0xFF1F2937), height: 1),
                      const SizedBox(height: 10),
                      const Text('Track Sets Completed:', style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Row(
                        children: List.generate((ex['done'] as List).length, (sIdx) {
                          final isDone = (ex['done'] as List)[sIdx] as bool;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  (ex['done'] as List)[sIdx] = !isDone;
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isDone ? const Color(0xFF10B981) : const Color(0xFF1F2937),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: isDone ? const Color(0xFF10B981) : const Color(0xFF374151)),
                                ),
                                child: Text(
                                  'Set ${sIdx + 1}',
                                  style: TextStyle(
                                    color: isDone ? Colors.black : const Color(0xFF9CA3AF),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 16),

          // Finish Workout Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.check_circle, size: 20),
              label: const Text('Complete Workout For Today', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: const Color(0xFF111827),
                    title: const Text('Workout Completed! 🔥', style: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w800)),
                    content: const Text(
                      'Awesome job crushing today\'s routine! Your attendance and workout data have been logged.',
                      style: TextStyle(color: Color(0xFFD1D5DB), fontSize: 14),
                    ),
                    actions: [
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Keep It Up', style: TextStyle(fontWeight: FontWeight.w800)),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 60),
        ],
      ),
    );
  }
}
