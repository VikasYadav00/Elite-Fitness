import 'package:flutter/material.dart';
import '../../../core/auth/api_service.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/stat_card.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<dynamic> _transactions = [];
  List<dynamic> _expenses = [];

  double _totalRevenue = 145200;
  double _pendingDues = 12500;
  double _totalExpenses = 38400;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final payRes = await ApiService.getPayments();
      if (payRes['success'] == true && payRes['data'] != null) {
        _transactions = payRes['data'] as List<dynamic>;
      }
    } catch (_) {}

    try {
      final expRes = await ApiService.getExpenses();
      if (expRes['success'] == true && expRes['data'] != null) {
        _expenses = expRes['data'] as List<dynamic>;
      }
    } catch (_) {}

    if (_transactions.isEmpty) {
      _transactions = [
        {'id': 'TX1001', 'member_name': 'Rahul Sharma', 'plan_name': 'Annual VIP', 'amount': 12000, 'method': 'UPI', 'status': 'COMPLETED', 'date': 'Today, 10:30 AM'},
        {'id': 'TX1002', 'member_name': 'Priya Patel', 'plan_name': 'Quarterly Pro', 'amount': 3800, 'method': 'Card', 'status': 'COMPLETED', 'date': 'Today, 09:15 AM'},
        {'id': 'TX1003', 'member_name': 'Amit Kumar', 'plan_name': 'Monthly Standard', 'amount': 1500, 'method': 'Cash', 'status': 'COMPLETED', 'date': 'Yesterday'},
        {'id': 'TX1004', 'member_name': 'Sneha Rao', 'plan_name': 'Quarterly Pro', 'amount': 3800, 'method': 'UPI', 'status': 'PENDING', 'date': 'Yesterday'},
        {'id': 'TX1005', 'member_name': 'Vikas Verma', 'plan_name': 'Annual VIP', 'amount': 12000, 'method': 'NetBanking', 'status': 'COMPLETED', 'date': '17 Sep 2026'},
      ];
    }

    if (_expenses.isEmpty) {
      _expenses = [
        {'id': 'EX1', 'title': 'Gym Floor Rent', 'category': 'Rent', 'amount': 25000, 'date': '01 Sep 2026'},
        {'id': 'EX2', 'title': 'Electricity Bill', 'category': 'Utilities', 'amount': 6400, 'date': '05 Sep 2026'},
        {'id': 'EX3', 'title': 'Dumbbell Rack Repair', 'category': 'Maintenance', 'amount': 2500, 'date': '10 Sep 2026'},
        {'id': 'EX4', 'title': 'Housekeeping Supplies', 'category': 'Supplies', 'amount': 4500, 'date': '14 Sep 2026'},
      ];
    }

    setState(() => _isLoading = false);
  }

  void _showAddExpenseModal() {
    final titleCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    String category = 'Utilities';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Record Expense', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                  IconButton(icon: const Icon(Icons.close, color: Color(0xFF9CA3AF)), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),
              _buildModalTextField('Expense Title', 'e.g. AC Servicing', titleCtrl),
              const SizedBox(height: 12),
              _buildModalTextField('Amount (₹)', '1500', amountCtrl, isNumber: true),
              const SizedBox(height: 12),
              const Text('Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(10)),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: category,
                    dropdownColor: const Color(0xFF1F2937),
                    isExpanded: true,
                    style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
                    items: ['Rent', 'Utilities', 'Maintenance', 'Salaries', 'Supplies', 'Marketing']
                        .map((cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                        .toList(),
                    onChanged: (val) => setModalState(() => category = val!),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  onPressed: () async {
                    if (titleCtrl.text.isEmpty || amountCtrl.text.isEmpty) return;
                    final newExp = {
                      'id': 'EX${DateTime.now().millisecondsSinceEpoch}',
                      'title': titleCtrl.text.trim(),
                      'amount': double.tryParse(amountCtrl.text) ?? 0,
                      'category': category,
                      'date': 'Today',
                    };
                    try {
                      await ApiService.addExpense(newExp);
                    } catch (_) {}
                    setState(() {
                      _expenses.insert(0, newExp);
                      _totalExpenses += (newExp['amount'] as num);
                    });
                    if (mounted) Navigator.pop(ctx);
                  },
                  child: const Text('Add Expense', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModalTextField(String label, String hint, TextEditingController ctrl, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          style: const TextStyle(color: Color(0xFFF9FAFB), fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
            filled: true,
            fillColor: const Color(0xFF1F2937),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final netProfit = _totalRevenue - _totalExpenses;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFEF4444),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Expense', style: TextStyle(fontWeight: FontWeight.w800)),
        onPressed: _showAddExpenseModal,
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: const Color(0xFFF59E0B),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFF59E0B)))
            : NestedScrollView(
                headerSliverBuilder: (context, innerBoxIsScrolled) => [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Financial Management', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFF9FAFB))),
                          const SizedBox(height: 4),
                          const Text('Track revenue, member dues & gym expenses', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: StatCard(
                                  label: 'TOTAL REVENUE',
                                  value: '₹${(_totalRevenue / 1000).toStringAsFixed(1)}K',
                                  icon: Icons.trending_up,
                                  iconColor: const Color(0xFF10B981),
                                  valueColor: const Color(0xFF10B981),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: StatCard(
                                  label: 'EXPENSES',
                                  value: '₹${(_totalExpenses / 1000).toStringAsFixed(1)}K',
                                  icon: Icons.trending_down,
                                  iconColor: const Color(0xFFEF4444),
                                  valueColor: const Color(0xFFEF4444),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: StatCard(
                                  label: 'NET PROFIT',
                                  value: '₹${(netProfit / 1000).toStringAsFixed(1)}K',
                                  icon: Icons.account_balance_wallet,
                                  iconColor: const Color(0xFFF59E0B),
                                  valueColor: const Color(0xFFF59E0B),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: StatCard(
                                  label: 'PENDING DUES',
                                  value: '₹${(_pendingDues / 1000).toStringAsFixed(1)}K',
                                  icon: Icons.warning_amber_rounded,
                                  iconColor: const Color(0xFFF97316),
                                  valueColor: const Color(0xFFF97316),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Container(
                            decoration: BoxDecoration(color: const Color(0xFF111827), borderRadius: BorderRadius.circular(12)),
                            child: TabBar(
                              controller: _tabController,
                              indicatorColor: const Color(0xFFF59E0B),
                              indicatorWeight: 3,
                              labelColor: const Color(0xFFF59E0B),
                              unselectedLabelColor: const Color(0xFF9CA3AF),
                              labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                              tabs: const [
                                Tab(icon: Icon(Icons.receipt_long, size: 18), text: 'Member Payments'),
                                Tab(icon: Icon(Icons.money_off, size: 18), text: 'Gym Expenses'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                body: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildTransactionsTab(),
                    _buildExpensesTab(),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildTransactionsTab() {
    return ListView.builder(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80),
      itemCount: _transactions.length,
      itemBuilder: (context, index) {
        final tx = _transactions[index];
        final isCompleted = tx['status'] == 'COMPLETED';

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: GlassCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: isCompleted ? const Color(0xFF10B981).withOpacity(0.15) : const Color(0xFFF59E0B).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isCompleted ? Icons.check_circle_outline : Icons.schedule,
                    color: isCompleted ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tx['member_name'] ?? 'Member',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFFF9FAFB)),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${tx['plan_name']} • ${tx['method']} • ${tx['date']}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹${tx['amount']}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFFF9FAFB)),
                    ),
                    const SizedBox(height: 4),
                    StatusBadge(
                      label: tx['status'] ?? 'PAID',
                      color: isCompleted ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
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

  Widget _buildExpensesTab() {
    return ListView.builder(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80),
      itemCount: _expenses.length,
      itemBuilder: (context, index) {
        final exp = _expenses[index];

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: GlassCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.trending_down, color: Color(0xFFEF4444), size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        exp['title'] ?? 'Expense',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFFF9FAFB)),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${exp['category']} • ${exp['date']}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                    ],
                  ),
                ),
                Text(
                  '-₹${exp['amount']}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFFEF4444)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
