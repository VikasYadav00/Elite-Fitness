import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/widgets/glass_card.dart';

class MemberHomeScreen extends StatefulWidget {
  const MemberHomeScreen({super.key});

  @override
  State<MemberHomeScreen> createState() => _MemberHomeScreenState();
}

class _MemberHomeScreenState extends State<MemberHomeScreen> {
  int _waterGlasses = 5;
  final int _waterGoal = 8;
  int _gymStreak = 16;

  void _scanWallQr() {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFF10B981), width: 2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF10B981).withOpacity(0.25),
                blurRadius: 20,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.qr_code_scanner, color: Color(0xFF10B981), size: 22),
                      SizedBox(width: 8),
                      Text('Scan Wall QR Code', style: TextStyle(color: Color(0xFFF9FAFB), fontSize: 16, fontWeight: FontWeight.w800)),
                    ],
                  ),
                  IconButton(icon: const Icon(Icons.close, color: Color(0xFF9CA3AF)), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                height: 180,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.5)),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    const Icon(Icons.qr_code_scanner, size: 80, color: Color(0xFF10B981)),
                    Container(
                      width: 130,
                      height: 130,
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFF10B981), width: 2.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Point your camera at the QR code pasted on the gym entrance wall to mark attendance.',
                style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.check_circle, size: 18),
                  label: const Text('Scan Wall QR Now', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                  onPressed: () {
                    Navigator.pop(ctx);
                    setState(() {
                      _gymStreak++;
                    });
                    showDialog(
                      context: context,
                      builder: (sCtx) => AlertDialog(
                        backgroundColor: const Color(0xFF1A2235),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        title: const Row(
                          children: [
                            Icon(Icons.check_circle, color: Color(0xFF10B981), size: 28),
                            SizedBox(width: 10),
                            Text('Attendance Marked! 🎉', style: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w800, fontSize: 17)),
                          ],
                        ),
                        content: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('You have successfully checked in via Gym Wall QR Code.', style: TextStyle(color: Color(0xFFD1D5DB), fontSize: 14)),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: const Color(0xFF111827), borderRadius: BorderRadius.circular(10)),
                              child: Column(
                                children: [
                                  const Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Gym Point:', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                                      Text('Elite Fitness Main Gate', style: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w700, fontSize: 12)),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Streak:', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                                      Text('$_gymStreak Days 🔥', style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.w800, fontSize: 12)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        actions: [
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
                            onPressed: () => Navigator.pop(sCtx),
                            child: const Text('Let\'s Crush It! 💪', style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: RefreshIndicator(
        onRefresh: () async => await Future.delayed(const Duration(milliseconds: 500)),
        color: const Color(0xFFF59E0B),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Welcome Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Welcome back,', style: TextStyle(fontSize: 14, color: Color(0xFF9CA3AF))),
                    SizedBox(height: 2),
                    Text('Rahul Sharma 💪', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  ],
                ),
                GestureDetector(
                  onTap: () => context.go('/member/profile'),
                  child: CircleAvatar(
                    radius: 22,
                    backgroundColor: const Color(0xFFF59E0B).withOpacity(0.2),
                    child: const Text('RS', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Wall QR Scan Action Card (Paste on Wall)
            GlassCard(
              gradient: const LinearGradient(
                colors: [Color(0xFF064E3B), Color(0xFF0B2922)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderColor: const Color(0xFF10B981).withOpacity(0.6),
              padding: const EdgeInsets.all(16),
              onTap: _scanWallQr,
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.25),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.qr_code_scanner, color: Color(0xFF10B981), size: 28),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text('Scan Gym Wall QR', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFFF9FAFB))),
                            SizedBox(width: 6),
                            Icon(Icons.stars, color: Color(0xFF10B981), size: 14),
                          ],
                        ),
                        SizedBox(height: 3),
                        Text('Self check-in by scanning the QR on the gym wall', style: TextStyle(fontSize: 11, color: Color(0xFFD1D5DB))),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('Scan Now', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // QR Pass Card
            GlassCard(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderColor: const Color(0xFFF59E0B).withOpacity(0.4),
              padding: const EdgeInsets.all(16),
              onTap: () => context.go('/member/pass'),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.qr_code_2, color: Color(0xFFF59E0B), size: 28),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('My Digital Entry Pass', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                        SizedBox(height: 2),
                        Text('Show barcode to receptionist or turnstile camera', style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: Color(0xFFF59E0B), size: 20),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Membership Status Widget
            GlassCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Active Plan: Annual VIP Elite', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                        child: const Text('142 DAYS LEFT', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w800)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: const LinearProgressIndicator(
                      value: 0.62,
                      minHeight: 8,
                      backgroundColor: Color(0xFF1F2937),
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFF59E0B)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Expires on: 28 Feb 2027', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                      Text('62% Completed', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Today's Routine Preview
            GlassCard(
              padding: const EdgeInsets.all(18),
              onTap: () => context.go('/member/workout'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.fitness_center, color: Color(0xFFF59E0B), size: 18),
                          SizedBox(width: 8),
                          Text("Today's Workout Routine", style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                        ],
                      ),
                      TextButton(
                        onPressed: () => context.go('/member/workout'),
                        child: const Text('View All', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text('Chest & Triceps Hypertrophy • 45 Mins', style: TextStyle(fontSize: 13, color: Color(0xFFF59E0B), fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  _exerciseRow('Barbell Bench Press', '4 Sets × 10 Reps'),
                  _exerciseRow('Incline Dumbbell Flyes', '3 Sets × 12 Reps'),
                  _exerciseRow('Cable Tricep Pushdown', '4 Sets × 15 Reps'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Water Intake Tracker & Streak Row
            Row(
              children: [
                Expanded(
                  child: GlassCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('HYDRATION', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11, fontWeight: FontWeight.w700)),
                            Icon(Icons.water_drop, color: Color(0xFF38BDF8), size: 18),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text('$_waterGlasses / $_waterGoal Cups', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            InkWell(
                              onTap: () {
                                if (_waterGlasses > 0) setState(() => _waterGlasses--);
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(6)),
                                child: const Icon(Icons.remove, color: Colors.white, size: 16),
                              ),
                            ),
                            const Spacer(),
                            InkWell(
                              onTap: () {
                                if (_waterGlasses < 15) setState(() => _waterGlasses++);
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(color: const Color(0xFF38BDF8), borderRadius: BorderRadius.circular(6)),
                                child: const Icon(Icons.add, color: Colors.black, size: 16),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GlassCard(
                    padding: const EdgeInsets.all(16),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('GYM STREAK', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11, fontWeight: FontWeight.w700)),
                            Icon(Icons.local_fire_department, color: Color(0xFFF97316), size: 18),
                          ],
                        ),
                        SizedBox(height: 10),
                        Text('16 Days', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                        SizedBox(height: 6),
                        Text('This month: 22 check-ins', style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                        SizedBox(height: 6),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Assigned Coach Card
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 22,
                    backgroundColor: Color(0xFF1F2937),
                    child: Icon(Icons.person, color: Color(0xFFF59E0B)),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Assigned Coach: Vikram R.', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFFF9FAFB))),
                        SizedBox(height: 2),
                        Text('Strength & Hypertrophy Coach', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chat_bubble_outline, color: Color(0xFF10B981)),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Opening coach chat...')));
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 60),
          ],
        ),
      ),
    );
  }

  Widget _exerciseRow(String name, String sets) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 16),
              const SizedBox(width: 8),
              Text(name, style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB))),
            ],
          ),
          Text(sets, style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
