import 'package:flutter/material.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/stat_card.dart';

class MembersScreen extends StatefulWidget {
  final String initialFilter;

  const MembersScreen({super.key, this.initialFilter = 'ALL'});

  @override
  State<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends State<MembersScreen> {
  final _searchCtrl = TextEditingController();
  late String _filterStatus;
  bool _isSquareGrid = true; // Default to Square format as requested!
  bool _showAddModal = false;
  Map<String, dynamic>? _selectedMember;

  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  String _selectedPlan = 'Quarterly Beast Mode';

  List<Map<String, dynamic>> _members = [
    {
      'id': '1',
      'registration_id': 'EF26091001',
      'full_name': 'Rahul Sharma',
      'phone': '9876543210',
      'email': 'rahul@example.com',
      'status': 'ACTIVE',
      'plan_name': 'Quarterly Beast Mode',
      'end_date': '2026-12-15',
    },
    {
      'id': '2',
      'registration_id': 'EF26091002',
      'full_name': 'Priya Verma',
      'phone': '9812345678',
      'email': 'priya@example.com',
      'status': 'ACTIVE',
      'plan_name': 'Monthly Pass',
      'end_date': '2026-10-18',
    },
    {
      'id': '3',
      'registration_id': 'EF26091003',
      'full_name': 'Ankit Mehra',
      'phone': '9711223344',
      'email': 'ankit@example.com',
      'status': 'EXPIRING',
      'plan_name': 'Monthly Pass',
      'end_date': '2026-09-23', // Expiring in 4 days!
    },
    {
      'id': '4',
      'registration_id': 'EF26091004',
      'full_name': 'Pooja Joshi',
      'phone': '9822334455',
      'email': 'pooja@example.com',
      'status': 'EXPIRING',
      'plan_name': 'Quarterly Pro',
      'end_date': '2026-09-25', // Expiring in 6 days!
    },
    {
      'id': '5',
      'registration_id': 'EF26091005',
      'full_name': 'Amit Patel',
      'phone': '9765432109',
      'email': 'amit@example.com',
      'status': 'EXPIRED',
      'plan_name': 'Monthly Pass',
      'end_date': '2026-09-01',
    },
    {
      'id': '6',
      'registration_id': 'EF26091006',
      'full_name': 'Sneha Gupta',
      'phone': '9988776655',
      'email': 'sneha@example.com',
      'status': 'FROZEN',
      'plan_name': 'Annual Champion',
      'end_date': '2027-04-20',
    },
    {
      'id': '7',
      'registration_id': 'EF26091007',
      'full_name': 'Vikram Singh',
      'phone': '9123456789',
      'email': 'vikram@example.com',
      'status': 'ACTIVE',
      'plan_name': 'Half-Yearly Elite',
      'end_date': '2027-02-10',
    },
    {
      'id': '8',
      'registration_id': 'EF26091008',
      'full_name': 'Rohan Kapoor',
      'phone': '9899001122',
      'email': 'rohan@example.com',
      'status': 'EXPIRING',
      'plan_name': 'Annual VIP Elite',
      'end_date': '2026-09-22',
    },
  ];

  @override
  void initState() {
    super.initState();
    _filterStatus = widget.initialFilter.toUpperCase();
    _fetchMembers();
  }

  @override
  void didUpdateWidget(covariant MembersScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialFilter != widget.initialFilter) {
      setState(() {
        _filterStatus = widget.initialFilter.toUpperCase();
      });
    }
  }

  Future<void> _fetchMembers() async {
    try {
      final res = await ApiService.getMembers();
      final data = res['data'] as List?;
      if (data != null && mounted) {
        setState(() => _members = data.cast<Map<String, dynamic>>());
      }
    } catch (_) {}
  }

  bool _isExpiring(Map<String, dynamic> m) {
    if (m['status'] == 'EXPIRING') return true;
    final endDateStr = m['end_date'] as String?;
    if (endDateStr == null) return false;
    final end = DateTime.tryParse(endDateStr);
    if (end == null) return false;
    final diff = end.difference(DateTime.now()).inDays;
    return diff >= 0 && diff <= 10;
  }

  List<Map<String, dynamic>> get _filteredMembers {
    final q = _searchCtrl.text.toLowerCase();
    return _members.where((m) {
      final matchSearch = q.isEmpty ||
          (m['full_name'] as String).toLowerCase().contains(q) ||
          (m['registration_id'] as String).toLowerCase().contains(q) ||
          (m['phone'] as String? ?? '').contains(q);

      bool matchStatus = true;
      if (_filterStatus == 'ALL') {
        matchStatus = true;
      } else if (_filterStatus == 'ACTIVE') {
        matchStatus = m['status'] == 'ACTIVE';
      } else if (_filterStatus == 'EXPIRING') {
        matchStatus = _isExpiring(m);
      } else if (_filterStatus == 'EXPIRED') {
        matchStatus = m['status'] == 'EXPIRED';
      } else if (_filterStatus == 'FROZEN') {
        matchStatus = m['status'] == 'FROZEN';
      }

      return matchSearch && matchStatus;
    }).toList();
  }

  void _addMember() {
    final newMember = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'registration_id': 'EF${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      'full_name': _nameCtrl.text,
      'phone': _phoneCtrl.text,
      'email': _emailCtrl.text,
      'status': 'ACTIVE',
      'plan_name': _selectedPlan,
      'end_date': DateTime.now().add(const Duration(days: 90)).toIso8601String().substring(0, 10),
    };
    setState(() {
      _members.insert(0, newMember);
      _showAddModal = false;
    });
    ApiService.createMember(newMember).catchError((_) => <String, dynamic>{});
  }

  void _toggleFreeze(String id) {
    setState(() {
      _members = _members.map((m) {
        if (m['id'] == id) {
          return {...m, 'status': m['status'] == 'FROZEN' ? 'ACTIVE' : 'FROZEN'};
        }
        return m;
      }).toList();
      _selectedMember = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredMembers;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: Stack(
        children: [
          Column(
            children: [
              // Search & Filter header
              Container(
                color: const Color(0xFF0B0F17),
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _searchCtrl,
                            onChanged: (_) => setState(() {}),
                            style: const TextStyle(color: Color(0xFFF9FAFB)),
                            decoration: InputDecoration(
                              hintText: 'Search by name, reg ID, phone...',
                              hintStyle: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
                              prefixIcon: const Icon(Icons.search, color: Color(0xFF6B7280), size: 20),
                              suffixIcon: _searchCtrl.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, color: Color(0xFF6B7280), size: 18),
                                      onPressed: () {
                                        _searchCtrl.clear();
                                        setState(() {});
                                      },
                                    )
                                  : null,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Square Grid vs List view toggle
                        Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF1A2235),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFF1F2937)),
                          ),
                          child: IconButton(
                            icon: Icon(
                              _isSquareGrid ? Icons.grid_view_rounded : Icons.view_list_rounded,
                              color: const Color(0xFFF59E0B),
                              size: 20,
                            ),
                            tooltip: _isSquareGrid ? 'Switch to List View' : 'Switch to Square Cards',
                            onPressed: () => setState(() => _isSquareGrid = !_isSquareGrid),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Filter Chips (ALL, ACTIVE, EXPIRING, EXPIRED, FROZEN)
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ['ALL', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'FROZEN'].map((st) {
                          final sel = _filterStatus == st;
                          Color activeColor = const Color(0xFFF59E0B);
                          if (st == 'ACTIVE') activeColor = const Color(0xFF10B981);
                          if (st == 'EXPIRING') activeColor = const Color(0xFFF97316);
                          if (st == 'EXPIRED') activeColor = const Color(0xFFEF4444);
                          if (st == 'FROZEN') activeColor = const Color(0xFF38BDF8);

                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(st),
                              selected: sel,
                              onSelected: (_) => setState(() => _filterStatus = st),
                              selectedColor: activeColor.withOpacity(0.2),
                              checkmarkColor: activeColor,
                              labelStyle: TextStyle(
                                color: sel ? activeColor : const Color(0xFF9CA3AF),
                                fontWeight: sel ? FontWeight.w800 : FontWeight.w600,
                                fontSize: 11,
                              ),
                              side: BorderSide(color: sel ? activeColor : const Color(0xFF374151)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),

              // Status Summary Count
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Showing ${filtered.length} ${_filterStatus == 'ALL' ? 'Total' : _filterStatus} Members',
                      style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      _isSquareGrid ? 'Square Format' : 'List Format',
                      style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),

              // Members Body (Square Grid or List View)
              Expanded(
                child: RefreshIndicator(
                  color: const Color(0xFFF59E0B),
                  onRefresh: _fetchMembers,
                  child: filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.people_outline, size: 50, color: const Color(0xFF6B7280).withOpacity(0.5)),
                              const SizedBox(height: 12),
                              Text('No ${_filterStatus == 'ALL' ? '' : _filterStatus} members found', style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14)),
                            ],
                          ),
                        )
                      : _isSquareGrid
                          ? _buildSquareGrid(filtered)
                          : _buildListView(filtered),
                ),
              ),
            ],
          ),

          // Add Member Modal
          if (_showAddModal) _buildAddModal(),

          // Member Details Bottom Sheet
          if (_selectedMember != null) _buildDetailSheet(_selectedMember!),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => setState(() => _showAddModal = true),
        backgroundColor: const Color(0xFFF59E0B),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.person_add),
        label: const Text('Add Member', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
    );
  }

  // ── SQUARE FORMAT GRID (2 COLUMNS) ──
  Widget _buildSquareGrid(List<Map<String, dynamic>> list) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.84, // Optimal square proportions
      ),
      itemCount: list.length,
      itemBuilder: (context, i) {
        final m = list[i];
        final isExp = _isExpiring(m);
        final status = isExp ? 'EXPIRING' : (m['status'] as String? ?? 'ACTIVE');

        Color statusColor = const Color(0xFF10B981);
        if (status == 'EXPIRING') statusColor = const Color(0xFFF97316);
        if (status == 'EXPIRED') statusColor = const Color(0xFFEF4444);
        if (status == 'FROZEN') statusColor = const Color(0xFF38BDF8);

        return GestureDetector(
          onTap: () => setState(() => _selectedMember = m),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1A2235),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: status == 'EXPIRING'
                    ? const Color(0xFFF97316).withOpacity(0.5)
                    : const Color(0xFF1F2937),
                width: status == 'EXPIRING' ? 1.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top: Initials avatar + Status badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: status == 'EXPIRING'
                              ? [const Color(0xFFF97316), const Color(0xFFEA580C)]
                              : [const Color(0xFFF59E0B), const Color(0xFFD97706)],
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(
                          (m['full_name'] as String).isNotEmpty ? (m['full_name'] as String)[0].toUpperCase() : 'M',
                          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 16),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: statusColor.withOpacity(0.4)),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
                const Spacer(),

                // Middle: Full Name
                Text(
                  m['full_name'] as String,
                  style: const TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w800, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),

                // Monospace Reg ID
                Text(
                  m['registration_id'] as String,
                  style: const TextStyle(color: Color(0xFFF59E0B), fontFamily: 'monospace', fontWeight: FontWeight.w700, fontSize: 11),
                ),
                const SizedBox(height: 6),

                // Plan Name Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    m['plan_name'] as String? ?? 'Standard Plan',
                    style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 10, fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 6),

                // Expiry / Due Date
                Row(
                  children: [
                    Icon(
                      status == 'EXPIRING' ? Icons.warning_amber_rounded : Icons.calendar_today,
                      size: 11,
                      color: status == 'EXPIRING' ? const Color(0xFFF97316) : const Color(0xFF6B7280),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        status == 'EXPIRING' ? 'Expires soon' : (m['end_date'] as String? ?? 'Ongoing'),
                        style: TextStyle(
                          color: status == 'EXPIRING' ? const Color(0xFFF97316) : const Color(0xFF9CA3AF),
                          fontSize: 10,
                          fontWeight: status == 'EXPIRING' ? FontWeight.w700 : FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── DETAILED LIST VIEW (ALTERNATIVE) ──
  Widget _buildListView(List<Map<String, dynamic>> list) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
      itemCount: list.length,
      itemBuilder: (context, i) {
        final m = list[i];
        final isExp = _isExpiring(m);
        final status = isExp ? 'EXPIRING' : (m['status'] as String? ?? 'ACTIVE');

        Color statusColor = const Color(0xFF10B981);
        if (status == 'EXPIRING') statusColor = const Color(0xFFF97316);
        if (status == 'EXPIRED') statusColor = const Color(0xFFEF4444);
        if (status == 'FROZEN') statusColor = const Color(0xFF38BDF8);

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: GlassCard(
            padding: const EdgeInsets.all(16),
            onTap: () => setState(() => _selectedMember = m),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(child: Text((m['full_name'] as String)[0], style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 18))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m['full_name'] as String, style: const TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 2),
                      Text('${m['registration_id']} • ${m['plan_name']}', style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                      const SizedBox(height: 2),
                      Text(m['phone'] as String? ?? '', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    StatusBadge(label: status, color: statusColor),
                    const SizedBox(height: 4),
                    Text(
                      m['end_date'] as String? ?? '',
                      style: TextStyle(color: isExp ? const Color(0xFFF97316) : const Color(0xFF6B7280), fontSize: 10, fontWeight: isExp ? FontWeight.w700 : FontWeight.normal),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── ADD MEMBER MODAL ──
  Widget _buildAddModal() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1A2235),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF1F2937)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Add New Member', style: TextStyle(color: Color(0xFFF9FAFB), fontSize: 18, fontWeight: FontWeight.w800)),
                    IconButton(icon: const Icon(Icons.close, color: Color(0xFF9CA3AF)), onPressed: () => setState(() => _showAddModal = false)),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(controller: _nameCtrl, style: const TextStyle(color: Color(0xFFF9FAFB)), decoration: const InputDecoration(labelText: 'Full Name', hintText: 'Rahul Sharma')),
                const SizedBox(height: 12),
                TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, style: const TextStyle(color: Color(0xFFF9FAFB)), decoration: const InputDecoration(labelText: 'Phone', hintText: '9876543210')),
                const SizedBox(height: 12),
                TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, style: const TextStyle(color: Color(0xFFF9FAFB)), decoration: const InputDecoration(labelText: 'Email', hintText: 'rahul@example.com')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _selectedPlan,
                  dropdownColor: const Color(0xFF1F2937),
                  style: const TextStyle(color: Color(0xFFF9FAFB)),
                  decoration: const InputDecoration(labelText: 'Membership Plan'),
                  items: ['Monthly Pass', 'Quarterly Beast Mode', 'Half-Yearly Elite', 'Annual Champion'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                  onChanged: (v) => setState(() => _selectedPlan = v!),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(onPressed: _addMember, child: const Text('Save & Register Member')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── DETAIL BOTTOM SHEET ──
  Widget _buildDetailSheet(Map<String, dynamic> m) {
    final isFrozen = m['status'] == 'FROZEN';

    return GestureDetector(
      onTap: () => setState(() => _selectedMember = null),
      child: Container(
        color: Colors.black54,
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Color(0xFF111827),
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                border: Border(top: BorderSide(color: Color(0xFF1F2937))),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m['full_name'] as String, style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 18, fontWeight: FontWeight.w800)),
                          Text(m['registration_id'] as String, style: const TextStyle(color: Color(0xFFF59E0B), fontFamily: 'monospace', fontWeight: FontWeight.w700)),
                        ],
                      ),
                      StatusBadge.fromStatus(m['status'] as String? ?? 'ACTIVE'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Color(0xFF1F2937)),
                  const SizedBox(height: 12),
                  _detailRow('Phone', m['phone'] as String? ?? '-'),
                  _detailRow('Email', m['email'] as String? ?? '-'),
                  _detailRow('Plan', m['plan_name'] as String? ?? '-'),
                  _detailRow('Valid Until', m['end_date'] as String? ?? '-'),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _toggleFreeze(m['id'] as String),
                          icon: Icon(isFrozen ? Icons.play_arrow : Icons.pause),
                          label: Text(isFrozen ? 'Unfreeze' : 'Freeze Pass'),
                          style: OutlinedButton.styleFrom(foregroundColor: isFrozen ? const Color(0xFF10B981) : const Color(0xFF38BDF8)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Calling ${m['phone']}...')));
                          },
                          icon: const Icon(Icons.phone),
                          label: const Text('Call Member'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String val) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
          Text(val, style: const TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}
