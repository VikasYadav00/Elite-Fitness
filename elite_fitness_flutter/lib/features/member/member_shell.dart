import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MemberShell extends StatelessWidget {
  final Widget child;
  final String currentPath;

  const MemberShell({super.key, required this.child, required this.currentPath});

  static const _navItems = [
    (icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home', path: '/member/home'),
    (icon: Icons.fitness_center_outlined, activeIcon: Icons.fitness_center, label: 'Workout', path: '/member/workout'),
    (icon: Icons.restaurant_menu_outlined, activeIcon: Icons.restaurant_menu, label: 'Diet', path: '/member/diet'),
    (icon: Icons.qr_code_2_outlined, activeIcon: Icons.qr_code_2, label: 'QR Pass', path: '/member/pass'),
    (icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile', path: '/member/profile'),
  ];

  int _selectedIndex() {
    if (currentPath.startsWith('/member/home')) return 0;
    if (currentPath.startsWith('/member/workout')) return 1;
    if (currentPath.startsWith('/member/diet')) return 2;
    if (currentPath.startsWith('/member/pass')) return 3;
    if (currentPath.startsWith('/member/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _selectedIndex();

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(child: Text('EF', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.w900))),
            ),
            const SizedBox(width: 10),
            const Text('Elite Member', style: TextStyle(color: Color(0xFFF9FAFB), fontSize: 16, fontWeight: FontWeight.w800)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle, color: Color(0xFF10B981), size: 12),
                  SizedBox(width: 4),
                  Text('ACTIVE', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w800)),
                ],
              ),
            ),
          ],
        ),
      ),
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
          onTap: (index) => context.go(_navItems[index].path),
          items: _navItems.map((item) {
            return BottomNavigationBarItem(
              icon: Icon(item.icon),
              activeIcon: Icon(item.activeIcon),
              label: item.label,
            );
          }).toList(),
        ),
      ),
    );
  }
}
