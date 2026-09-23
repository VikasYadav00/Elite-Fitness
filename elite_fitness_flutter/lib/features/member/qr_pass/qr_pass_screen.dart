import 'dart:async';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/widgets/glass_card.dart';

class QRPassScreen extends StatefulWidget {
  const QRPassScreen({super.key});

  @override
  State<QRPassScreen> createState() => _QRPassScreenState();
}

class _QRPassScreenState extends State<QRPassScreen> {
  late Timer _timer;
  late DateTime _currentTime;

  @override
  void initState() {
    super.initState();
    _currentTime = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _currentTime = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    final s = dt.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    const regId = 'EF-2026-0842';
    final qrData = 'ELITE_FITNESS_PASS:$regId:${_currentTime.millisecondsSinceEpoch}';

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 10),
            const Text(
              'Digital Entry Pass',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB)),
            ),
            const SizedBox(height: 4),
            const Text(
              'Scan this QR at the turnstile or front desk scanner',
              style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Live Digital Gym Pass
            GlassCard(
              padding: const EdgeInsets.all(24),
              borderColor: const Color(0xFFF59E0B).withOpacity(0.5),
              child: Column(
                children: [
                  // Pass Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Center(child: Text('EF', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900))),
                          ),
                          const SizedBox(width: 10),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('ELITE FITNESS', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFFF9FAFB), letterSpacing: 0.5)),
                              Text('ACCESS PASS', style: TextStyle(fontSize: 10, color: Color(0xFFF59E0B), fontWeight: FontWeight.w800, letterSpacing: 1)),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.5)),
                        ),
                        child: const Text('ACTIVE', style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w800)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // QR Code Box with White Background for reliable scanning
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withOpacity(0.25),
                          blurRadius: 20,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: QrImageView(
                      data: qrData,
                      version: QrVersions.auto,
                      size: 200.0,
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Live Digital Security Clock
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF111827),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF1F2937)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle)),
                        const SizedBox(width: 8),
                        Text(
                          'Live Security Time: ${_formatTime(_currentTime)}',
                          style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Divider(color: Color(0xFF1F2937), height: 1),
                  const SizedBox(height: 16),

                  // Member Information Details
                  _infoRow('Member Name', 'Rahul Sharma'),
                  const SizedBox(height: 8),
                  _infoRow('Registration ID', regId),
                  const SizedBox(height: 8),
                  _infoRow('Plan Tier', 'Annual VIP Elite'),
                  const SizedBox(height: 8),
                  _infoRow('Valid Until', '28 Feb 2027'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Instruction Note
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937).withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF374151)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Color(0xFFF59E0B), size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Hold your phone 10-15 cm away from the gym turnstile camera for instant contact-free entry.',
                      style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFF9FAFB))),
      ],
    );
  }
}
