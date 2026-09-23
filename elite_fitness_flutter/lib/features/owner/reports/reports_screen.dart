import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/stat_card.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  String _selectedPeriod = 'This Month';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Analytics & Reports', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  const SizedBox(height: 4),
                  const Text('Gym business performance insights', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(10)),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedPeriod,
                    dropdownColor: const Color(0xFF1F2937),
                    style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 12, fontWeight: FontWeight.w700),
                    items: ['This Week', 'This Month', 'Last Quarter', 'This Year']
                        .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedPeriod = val!),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'RETENTION RATE',
                  value: '87.4%',
                  icon: Icons.repeat,
                  iconColor: const Color(0xFF10B981),
                  subtitle: '+3.2% vs last month',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  label: 'AVG DAILY VISITS',
                  value: '64',
                  icon: Icons.groups,
                  iconColor: const Color(0xFF3B82F6),
                  subtitle: 'Peak 6:00 - 8:30 PM',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'NEW SIGNUPS',
                  value: '28',
                  icon: Icons.person_add,
                  iconColor: const Color(0xFFF59E0B),
                  subtitle: 'This month',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  label: 'NET CASHFLOW',
                  value: '₹1.06L',
                  icon: Icons.account_balance,
                  iconColor: const Color(0xFF8B5CF6),
                  subtitle: 'Revenue - Expenses',
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Monthly Revenue (₹ in Thousands)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                const SizedBox(height: 6),
                const Text('Jan - Sep 2026', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 24),
                SizedBox(
                  height: 180,
                  child: BarChart(
                    BarChartData(
                      barGroups: [
                        BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 65, color: const Color(0xFFF59E0B), width: 14, borderRadius: BorderRadius.circular(4))]),
                        BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 78, color: const Color(0xFFF59E0B), width: 14, borderRadius: BorderRadius.circular(4))]),
                        BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 92, color: const Color(0xFFF59E0B), width: 14, borderRadius: BorderRadius.circular(4))]),
                        BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 88, color: const Color(0xFFF59E0B), width: 14, borderRadius: BorderRadius.circular(4))]),
                        BarChartGroupData(x: 5, barRods: [BarChartRodData(toY: 110, color: const Color(0xFFF59E0B), width: 14, borderRadius: BorderRadius.circular(4))]),
                        BarChartGroupData(x: 6, barRods: [BarChartRodData(toY: 125, color: const Color(0xFFF59E0B), width: 14, borderRadius: BorderRadius.circular(4))]),
                        BarChartGroupData(x: 7, barRods: [BarChartRodData(toY: 132, color: const Color(0xFFF59E0B), width: 14, borderRadius: BorderRadius.circular(4))]),
                        BarChartGroupData(x: 8, barRods: [BarChartRodData(toY: 140, color: const Color(0xFFF59E0B), width: 14, borderRadius: BorderRadius.circular(4))]),
                        BarChartGroupData(x: 9, barRods: [BarChartRodData(toY: 145, color: const Color(0xFF10B981), width: 14, borderRadius: BorderRadius.circular(4))]),
                      ],
                      titlesData: FlTitlesData(
                        show: true,
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 34,
                            getTitlesWidget: (val, meta) => Text('${val.toInt()}K', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 10)),
                          ),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (val, meta) {
                              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
                              final idx = val.toInt() - 1;
                              if (idx >= 0 && idx < months.length) {
                                return Padding(padding: const EdgeInsets.only(top: 6), child: Text(months[idx], style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 10)));
                              }
                              return const SizedBox();
                            },
                          ),
                        ),
                      ),
                      gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (_) => const FlLine(color: Color(0xFF1F2937), strokeWidth: 1)),
                      borderData: FlBorderData(show: false),
                    ),
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
                const Text('Plan Distribution Breakdown', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                const SizedBox(height: 16),
                _planBar('Quarterly Pro (3 Mo)', 0.48, '48% • 72 Members', const Color(0xFFF59E0B)),
                const SizedBox(height: 12),
                _planBar('Annual VIP (12 Mo)', 0.32, '32% • 48 Members', const Color(0xFF10B981)),
                const SizedBox(height: 12),
                _planBar('Monthly Standard (1 Mo)', 0.20, '20% • 30 Members', const Color(0xFF3B82F6)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFF59E0B),
                    side: const BorderSide(color: Color(0xFFF59E0B)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  icon: const Icon(Icons.picture_as_pdf, size: 18),
                  label: const Text('Export PDF', style: TextStyle(fontWeight: FontWeight.w800)),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Exporting Financial Report PDF...')));
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1F2937),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  icon: const Icon(Icons.table_chart, size: 18),
                  label: const Text('Excel Sheet', style: TextStyle(fontWeight: FontWeight.w800)),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Downloading Excel Data...')));
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  Widget _planBar(String title, double progress, String subtitle, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFF9FAFB))),
            Text(subtitle, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: const Color(0xFF1F2937),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
