import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic> _stats = {
    'activeMembers': 148,
    'todayAttendance': 62,
    'monthlyRevenue': 178500,
    'expiringMemberships': 8,
  };

  final List<FlSpot> _revenueData = const [
    FlSpot(0, 12500), FlSpot(1, 18000), FlSpot(2, 14200),
    FlSpot(3, 22500), FlSpot(4, 31000), FlSpot(5, 45000), FlSpot(6, 28000),
  ];
  final List<String> _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final res = await ApiService.getDashboardStats();
      if (res['data'] != null && mounted) {
        setState(() => _stats = res['data'] as Map<String, dynamic>);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: RefreshIndicator(
        color: const Color(0xFFF59E0B),
        onRefresh: _fetchStats,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Welcome banner
            GlassCard(
              gradient: const LinearGradient(
                colors: [Color(0x26F59E0B), Color(0xE6111827)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(text: const TextSpan(children: [
                          TextSpan(text: 'Welcome back, ', style: TextStyle(color: Color(0xFFF9FAFB), fontSize: 17, fontWeight: FontWeight.w700, fontFamily: 'Inter')),
                          TextSpan(text: 'Gym Owner 👋', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 17, fontWeight: FontWeight.w800, fontFamily: 'Inter')),
                        ])),
                        const SizedBox(height: 4),
                        const Text("Here's Elite Fitness today.", style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: () => context.go('/owner/members'),
                    icon: const Icon(Icons.person_add_outlined, size: 16),
                    label: const Text('Add Member', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // KPI Grid
            GridView.count(
              crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12,
              shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.4,
              children: [
                StatCard(
                  label: 'ACTIVE MEMBERS',
                  value: '${_stats['activeMembers'] ?? 148}',
                  icon: Icons.people_outline,
                  iconColor: const Color(0xFFF59E0B),
                  subtitle: '▲ +12% from last month',
                  onTap: () => context.go('/owner/members?filter=ACTIVE'),
                ),
                StatCard(
                  label: "TODAY'S ATTENDANCE",
                  value: '${_stats['todayAttendance'] ?? 62}',
                  icon: Icons.how_to_reg_outlined,
                  iconColor: const Color(0xFF38BDF8),
                  subtitle: 'Active workout session',
                  onTap: () => context.go('/owner/attendance'),
                ),
                StatCard(
                  label: 'MONTHLY REVENUE',
                  value: '₹${_formatCurrency(_stats['monthlyRevenue'] ?? 178500)}',
                  icon: Icons.currency_rupee_outlined,
                  iconColor: const Color(0xFF10B981),
                  valueColor: const Color(0xFF10B981),
                  subtitle: '▲ ₹32,000 this week',
                  onTap: () => context.go('/owner/payments'),
                ),
                StatCard(
                  label: 'EXPIRING (7 DAYS)',
                  value: '${_stats['expiringMemberships'] ?? 8}',
                  icon: Icons.warning_amber_outlined,
                  iconColor: const Color(0xFFEF4444),
                  valueColor: const Color(0xFFF87171),
                  subtitle: 'Tap to view expiring',
                  onTap: () => context.go('/owner/members?filter=EXPIRING'),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Revenue Chart
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Revenue Analytics (Weekly)', style: TextStyle(color: Color(0xFFF9FAFB), fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 200,
                    child: LineChart(LineChartData(
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        getDrawingHorizontalLine: (_) => const FlLine(color: Color(0xFF1F2937), strokeWidth: 1),
                      ),
                      titlesData: FlTitlesData(
                        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) => Text('₹${(v/1000).toStringAsFixed(0)}k', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 9)), reservedSize: 38)),
                        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) => Text(v.toInt() < _days.length ? _days[v.toInt()] : '', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 10)), reservedSize: 22)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: _revenueData,
                          isCurved: true,
                          color: const Color(0xFFF59E0B),
                          barWidth: 3,
                          dotData: const FlDotData(show: false),
                          belowBarData: BarAreaData(
                            show: true,
                            gradient: LinearGradient(
                              colors: [const Color(0xFFF59E0B).withOpacity(0.3), const Color(0xFFF59E0B).withOpacity(0.0)],
                              begin: Alignment.topCenter, end: Alignment.bottomCenter,
                            ),
                          ),
                        ),
                      ],
                    )),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick Actions
            const Text('Quick Actions', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
            const SizedBox(height: 10),
            Row(
              children: [
                _quickAction(context, Icons.person_add_outlined, 'Add Member', () => context.go('/owner/members')),
                const SizedBox(width: 10),
                _quickAction(context, Icons.qr_code_scanner, 'Scan QR', () => context.go('/owner/attendance')),
                const SizedBox(width: 10),
                _quickAction(context, Icons.campaign_outlined, 'Broadcast', () => context.go('/owner/broadcast')),
                const SizedBox(width: 10),
                _quickAction(context, Icons.bar_chart, 'Reports', () => context.go('/owner/reports')),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _quickAction(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFF1A2235),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF1F2937)),
          ),
          child: Column(
            children: [
              Icon(icon, color: const Color(0xFFF59E0B), size: 22),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 10, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }

  String _formatCurrency(dynamic val) {
    final num n = val is num ? val : (int.tryParse(val.toString()) ?? 0);
    if (n >= 100000) return '${(n / 100000).toStringAsFixed(1)}L';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}k';
    return n.toString();
  }
}
