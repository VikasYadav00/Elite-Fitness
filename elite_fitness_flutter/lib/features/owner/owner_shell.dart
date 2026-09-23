import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class OwnerShell extends StatelessWidget {
  final Widget child;
  final String currentPath;

  const OwnerShell({super.key, required this.child, required this.currentPath});

  static const _navItems = [
    (icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard, label: 'Dashboard', path: '/owner/dashboard'),
    (icon: Icons.people_outline, activeIcon: Icons.people, label: 'Members', path: '/owner/members'),
    (icon: Icons.payments_outlined, activeIcon: Icons.payments, label: 'Finance', path: '/owner/payments'),
    (icon: Icons.fact_check_outlined, activeIcon: Icons.fact_check, label: 'Attendance', path: '/owner/attendance'),
    (icon: Icons.menu_outlined, activeIcon: Icons.menu, label: 'More', path: '/owner/more'),
  ];

  static const _drawerItems = [
    (icon: Icons.dashboard_outlined, label: 'Dashboard', path: '/owner/dashboard'),
    (icon: Icons.people_outline, label: 'Members', path: '/owner/members'),
    (icon: Icons.card_membership_outlined, label: 'Plans', path: '/owner/plans'),
    (icon: Icons.payments_outlined, label: 'Finance', path: '/owner/payments'),
    (icon: Icons.fact_check_outlined, label: 'Attendance', path: '/owner/attendance'),
    (icon: Icons.fitness_center_outlined, label: 'Trainers', path: '/owner/trainers'),
    (icon: Icons.sports_gymnastics_outlined, label: 'Workouts & Diets', path: '/owner/workouts'),
    (icon: Icons.track_changes_outlined, label: 'Leads CRM', path: '/owner/leads'),
    (icon: Icons.campaign_outlined, label: 'Broadcast', path: '/owner/broadcast'),
    (icon: Icons.bar_chart_outlined, label: 'Reports', path: '/owner/reports'),
    (icon: Icons.settings_outlined, label: 'Settings', path: '/owner/settings'),
  ];

  int _selectedIndex() {
    if (currentPath.startsWith('/owner/dashboard')) return 0;
    if (currentPath.startsWith('/owner/members')) return 1;
    if (currentPath.startsWith('/owner/payments')) return 2;
    if (currentPath.startsWith('/owner/attendance')) return 3;
    return 4;
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _selectedIndex();

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        title: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(child: Text('EF', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.w900))),
            ),
            const SizedBox(width: 10),
            const Text('Elite Fitness', style: TextStyle(color: Color(0xFFF9FAFB), fontSize: 16, fontWeight: FontWeight.w800)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.15),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
              ),
              child: const Text('OWNER', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1)),
            ),
          ],
        ),
        actions: [
          Builder(builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu, color: Color(0xFF9CA3AF)),
            onPressed: () => Scaffold.of(ctx).openEndDrawer(),
          )),
        ],
      ),
      endDrawer: _buildDrawer(context),
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF111827),
          border: Border(top: BorderSide(color: Color(0xFF1F2937))),
        ),
        child: BottomNavigationBar(
          currentIndex: selectedIndex,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: const Color(0xFFF59E0B),
          unselectedItemColor: const Color(0xFF6B7280),
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontSize: 10),
          onTap: (index) {
            if (index == 4) {
              Scaffold.of(context).openEndDrawer();
              return;
            }
            context.go(_navItems[index].path);
          },
          items: _navItems.map((item) => BottomNavigationBarItem(
            icon: Icon(item.icon, size: 22),
            activeIcon: Icon(item.activeIcon, size: 22),
            label: item.label,
          )).toList(),
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFF111827),
      width: 280,
      child: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1A2235), Color(0xFF111827)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(child: Text('EF', style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.w900))),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Elite Fitness', style: TextStyle(color: Color(0xFFF9FAFB), fontSize: 15, fontWeight: FontWeight.w800)),
                      Text('Owner Portal', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFF1F2937)),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: _drawerItems.map((item) {
                  final isActive = currentPath.startsWith(item.path);
                  return ListTile(
                    leading: Icon(item.icon, color: isActive ? const Color(0xFFF59E0B) : const Color(0xFF9CA3AF), size: 20),
                    title: Text(item.label, style: TextStyle(color: isActive ? const Color(0xFFF59E0B) : const Color(0xFFF9FAFB), fontSize: 14, fontWeight: isActive ? FontWeight.w700 : FontWeight.w500)),
                    tileColor: isActive ? const Color(0xFFF59E0B).withOpacity(0.08) : Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go(item.path);
                    },
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
