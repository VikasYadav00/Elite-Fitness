import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});
  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<Map<String, dynamic>> _attendance = [
    {'id': '1', 'reg_id': 'EF26091001', 'name': 'Rahul Sharma', 'time': '06:15 AM', 'method': 'QR', 'status': 'PRESENT'},
    {'id': '2', 'reg_id': 'EF26091002', 'name': 'Priya Verma', 'time': '07:30 AM', 'method': 'QR', 'status': 'PRESENT'},
    {'id': '3', 'reg_id': 'EF26091005', 'name': 'Vikram Singh', 'time': '08:10 AM', 'method': 'MANUAL', 'status': 'PRESENT'},
  ];

  final _regIdCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchAttendance();
  }

  Future<void> _fetchAttendance() async {
    try {
      final res = await ApiService.getAttendance();
      final data = res['data'] as List?;
      if (data != null && mounted) {
        setState(() => _attendance = data.cast<Map<String, dynamic>>());
      }
    } catch (_) {}
  }

  void _manualCheckin() {
    if (_regIdCtrl.text.isEmpty) return;
    final now = TimeOfDay.now();
    final entry = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'reg_id': _regIdCtrl.text,
      'name': 'Manual Entry',
      'time': '${now.hourOfPeriod}:${now.minute.toString().padLeft(2, '0')} ${now.period.name.toUpperCase()}',
      'method': 'MANUAL',
      'status': 'PRESENT',
    };
    setState(() => _attendance.insert(0, entry));
    _regIdCtrl.clear();
    ApiService.markAttendance(entry['reg_id']!).catchError((_) => <String, dynamic>{});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: Column(children: [
        // Counter card with Wall QR shortcut
        Padding(
          padding: const EdgeInsets.all(16),
          child: GlassCard(
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.15), borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.how_to_reg, color: Color(0xFFF59E0B), size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('MEMBERS PRESENT TODAY', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                    Text('${_attendance.length}', style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 30, fontWeight: FontWeight.w900)),
                  ]),
                ),
                ElevatedButton.icon(
                  onPressed: _showWallQrDialog,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.qr_code_2, size: 18),
                  label: const Text('Wall QR', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                ),
              ],
            ),
          ),
        ),
        // List header
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Row(children: [
            Expanded(flex: 2, child: Text('REG ID', style: TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.w700))),
            Expanded(flex: 3, child: Text('NAME', style: TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.w700))),
            Expanded(flex: 2, child: Text('TIME', style: TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.w700))),
            Expanded(flex: 2, child: Text('METHOD', style: TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.w700))),
          ]),
        ),
        const SizedBox(height: 8),
        // List
        Expanded(
          child: RefreshIndicator(
            color: const Color(0xFFF59E0B),
            onRefresh: _fetchAttendance,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _attendance.length,
              itemBuilder: (context, i) {
                final a = _attendance[i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A2235),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF1F2937)),
                  ),
                  child: Row(children: [
                    Expanded(flex: 2, child: Text(a['reg_id'] as String, style: const TextStyle(color: Color(0xFFF59E0B), fontFamily: 'monospace', fontWeight: FontWeight.w700, fontSize: 11))),
                    Expanded(flex: 3, child: Text(a['name'] as String, style: const TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w600, fontSize: 12))),
                    Expanded(flex: 2, child: Text(a['time'] as String, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11))),
                    Expanded(flex: 2, child: _methodBadge(a['method'] as String)),
                  ]),
                );
              },
            ),
          ),
        ),
      ]),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'wall_qr',
            onPressed: _showWallQrDialog,
            backgroundColor: const Color(0xFF10B981),
            foregroundColor: Colors.black,
            icon: const Icon(Icons.qr_code_2),
            label: const Text('Wall QR Poster', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'qr',
            onPressed: _openQrScanner,
            backgroundColor: const Color(0xFF1F2937),
            foregroundColor: const Color(0xFF38BDF8),
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Scan QR', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'manual',
            onPressed: _showManualDialog,
            backgroundColor: const Color(0xFFF59E0B),
            foregroundColor: Colors.black,
            icon: const Icon(Icons.person_add),
            label: const Text('Manual', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _showWallQrDialog() {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFF10B981), width: 2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF10B981).withOpacity(0.2),
                blurRadius: 25,
                spreadRadius: 4,
              ),
            ],
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'GYM WALL ATTENDANCE POSTER',
                    style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'ELITE FITNESS CLUB',
                  style: TextStyle(color: Color(0xFFF9FAFB), fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 1),
                ),
                const SizedBox(height: 4),
                const Text(
                  'SCAN TO MARK DAILY ATTENDANCE',
                  style: TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                ),
                const SizedBox(height: 18),

                // Scannable QR Code Box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: QrImageView(
                    data: 'ELITE_FITNESS_WALL_CHECKIN:MAIN_ENTRANCE:AUTO_LOG',
                    version: QrVersions.auto,
                    size: 200,
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F2937),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF374151)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.wallpaper, color: Color(0xFFF59E0B), size: 20),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Paste this poster on your gym wall. Members scan this using their Member App to check in.',
                          style: TextStyle(color: Color(0xFFD1D5DB), fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFF59E0B),
                          side: const BorderSide(color: Color(0xFFF59E0B)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.print, size: 16),
                        label: const Text('Print / Save', style: TextStyle(fontWeight: FontWeight.w700)),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Poster sent to printer / saved!'), backgroundColor: Color(0xFF10B981)),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Close', style: TextStyle(fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showManualDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1A2235),
        title: const Text('Manual Check-in', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.w800)),
        content: TextField(
          controller: _regIdCtrl,
          style: const TextStyle(color: Color(0xFFF9FAFB)),
          decoration: const InputDecoration(labelText: 'Registration ID or Phone', hintText: 'e.g. EF26091001'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel', style: TextStyle(color: Color(0xFF9CA3AF)))),
          ElevatedButton(onPressed: _manualCheckin, child: const Text('Log Attendance')),
        ],
      ),
    );
  }

  void _openQrScanner() {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const QRScannerScreen()));
  }

  Widget _methodBadge(String method) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: method == 'QR' ? const Color(0xFF38BDF8).withOpacity(0.15) : const Color(0xFFF59E0B).withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(method == 'QR' ? Icons.qr_code_2 : Icons.edit_outlined, size: 10, color: method == 'QR' ? const Color(0xFF38BDF8) : const Color(0xFFF59E0B)),
        const SizedBox(width: 4),
        Text(method, style: TextStyle(color: method == 'QR' ? const Color(0xFF38BDF8) : const Color(0xFFF59E0B), fontSize: 9, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});
  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  String? _scannedValue;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('QR Scanner', style: TextStyle(color: Color(0xFFF9FAFB))),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Color(0xFFF9FAFB)), onPressed: () => Navigator.pop(context)),
      ),
      body: Column(children: [
        Expanded(
          child: Stack(children: [
            // Camera placeholder (mobile_scanner would go here)
            Container(
              color: Colors.black87,
              child: const Center(
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.qr_code_scanner, color: Color(0xFFF59E0B), size: 80),
                  SizedBox(height: 16),
                  Text('Point camera at member QR code', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14)),
                  SizedBox(height: 8),
                  Text('Camera opens on device', style: TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
                ]),
              ),
            ),
            // Scan frame overlay
            Center(
              child: Container(
                width: 240, height: 240,
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFF59E0B), width: 2.5),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ]),
        ),
        if (_scannedValue != null)
          Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF111827),
            child: Column(children: [
              const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 40),
              const SizedBox(height: 8),
              Text('Scanned: $_scannedValue', style: const TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Mark Attendance & Close')),
            ]),
          ),
        // Demo scan button (for testing without camera)
        Padding(
          padding: const EdgeInsets.all(16),
          child: OutlinedButton.icon(
            onPressed: () => setState(() { _scannedValue = 'EF26091001 – Rahul Sharma'; }),
            icon: const Icon(Icons.qr_code_2),
            label: const Text('Simulate QR Scan (Demo)'),
            style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF38BDF8), side: const BorderSide(color: Color(0xFF38BDF8))),
          ),
        ),
      ]),
    );
  }
}
