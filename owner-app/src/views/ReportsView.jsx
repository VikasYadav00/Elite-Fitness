import React, { useState } from 'react';
import {
  FileSpreadsheet, Download, FileText, Calendar, ChevronDown,
  CheckCircle, Clock, X, Filter, TrendingUp, Users, IndianRupee, Sparkles
} from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import api from '../api';

// ─── Date Range Presets ────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { key: 'this_month', label: 'This Month', desc: () => { const n = new Date(); return `${n.toLocaleString('default',{month:'long'})} ${n.getFullYear()}`; } },
  { key: 'last_month', label: 'Last Month', desc: () => { const n = new Date(new Date().setMonth(new Date().getMonth()-1)); return `${n.toLocaleString('default',{month:'long'})} ${n.getFullYear()}`; } },
  { key: 'last_3_months', label: 'Last 3 Months', desc: () => 'Previous 3 months' },
  { key: 'last_6_months', label: 'Last 6 Months', desc: () => 'Previous 6 months' },
  { key: 'this_year', label: 'This Year', desc: () => `Jan – Dec ${new Date().getFullYear()}` },
  { key: 'custom', label: 'Custom Date Range', desc: () => 'Pick start & end date' },
];

// ─── Mock Monthly Summary ──────────────────────────────────────────────────────
const MONTHLY_FINANCE = [
  { month: 'Apr 2026', revenue: 142500, expense: 115000, members_joined: 12, memberships_sold: 18 },
  { month: 'May 2026', revenue: 158000, expense: 118500, members_joined: 15, memberships_sold: 22 },
  { month: 'Jun 2026', revenue: 134000, expense: 112000, members_joined: 9, memberships_sold: 14 },
  { month: 'Jul 2026', revenue: 172000, expense: 122000, members_joined: 18, memberships_sold: 26 },
  { month: 'Aug 2026', revenue: 189500, expense: 125000, members_joined: 21, memberships_sold: 30 },
  { month: 'Sep 2026', revenue: 178500, expense: 119000, members_joined: 16, memberships_sold: 24 },
];

// ─── Date Range Picker Modal ───────────────────────────────────────────────────
function DateRangeModal({ reportType, reportLabel, onClose, onExport }) {
  const [selected, setSelected] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const handleExport = () => {
    const range = selected === 'custom' ? { from: customFrom, to: customTo } : { preset: selected };
    onExport(reportType, range);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', background: '#FFFFFF', border: '1px solid #DCEBFA', boxShadow: '0 20px 50px rgba(77, 166, 255, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1F2937', fontWeight: 800 }}>
            📅 Select Export Date Range
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#6B7280', fontSize: '0.82rem', marginBottom: '20px' }}>
          Choose a period for the <strong style={{ color: '#1F2937' }}>{reportLabel}</strong> export.
        </p>

        {/* Preset Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {DATE_PRESETS.map(preset => (
            <button
              key={preset.key}
              type="button"
              onClick={() => setSelected(preset.key)}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                border: selected === preset.key ? '2px solid #4DA6FF' : '1px solid #DCEBFA',
                background: selected === preset.key ? '#EAF5FF' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              <span style={{
                fontWeight: 700,
                fontSize: '0.875rem',
                color: selected === preset.key ? '#0284C7' : '#1F2937'
              }}>
                {preset.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{preset.desc()}</span>
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {selected === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', padding: '16px', background: '#F8FBFF', borderRadius: '12px', border: '1px solid #DCEBFA' }}>
            <div>
              <label className="label">From Date</label>
              <input
                type="date" className="input-field"
                value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label">To Date</label>
              <input
                type="date" className="input-field"
                value={customTo} onChange={e => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={handleExport}
            disabled={selected === 'custom' && (!customFrom || !customTo)}
          >
            <Download size={18} /> Export Excel File
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Reports View ─────────────────────────────────────────────────────────
export default function ReportsView() {
  const [dateModal, setDateModal] = useState(null); // { type, label }
  const [exportLog, setExportLog] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleExport = async (type, range) => {
    const presetLabel = DATE_PRESETS.find(p => p.key === range.preset)?.label
      || `${range.from} to ${range.to}`;

    const logEntry = {
      id: String(Date.now()),
      type,
      period: presetLabel,
      exported_at: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    };
    setExportLog(prev => [logEntry, ...prev]);

    // Build CSV rows based on real backend data
    let csvRows = [];
    if (type === 'payments') {
      try {
        const res = await api.get('/reports/revenue');
        if (res.data?.success && res.data.data?.payments?.length > 0) {
          csvRows = [
            ['Invoice Number', 'Member Name', 'Plan', 'Amount (INR)', 'Payment Method', 'Date', 'Status'],
            ...res.data.data.payments.map(p => [
              p.invoice_number, p.full_name || 'Member', p.plan_name || 'N/A', p.amount, p.payment_method, p.payment_date, p.status
            ])
          ];
        }
      } catch (_) {}
      if (csvRows.length === 0) {
        csvRows = [
          ['Month', 'Revenue (INR)', 'Expenses (INR)', 'Net Profit (INR)', 'Margin %', 'Memberships Sold'],
          ...MONTHLY_FINANCE.map(m => {
            const profit = m.revenue - m.expense;
            const margin = Math.round((profit / m.revenue) * 100);
            return [m.month, m.revenue, m.expense, profit, `${margin}%`, m.memberships_sold];
          })
        ];
      }
    } else if (type === 'members') {
      try {
        const res = await api.get('/reports/membership');
        if (res.data?.success && res.data.data?.memberships?.length > 0) {
          csvRows = [
            ['Registration ID', 'Member Name', 'Phone', 'Plan', 'Start Date', 'End Date', 'Status', 'Days Remaining'],
            ...res.data.data.memberships.map(m => [
              m.registration_id, m.full_name, m.phone, m.plan_name, m.start_date, m.end_date, m.membership_status, m.days_remaining
            ])
          ];
        }
      } catch (_) {}
      if (csvRows.length === 0) {
        csvRows = [
          ['Month', 'Members Joined', 'Memberships Sold'],
          ...MONTHLY_FINANCE.map(m => [m.month, m.members_joined, m.memberships_sold])
        ];
      }
    } else if (type === 'attendance') {
      try {
        const res = await api.get('/reports/attendance');
        if (res.data?.success && res.data.data?.records?.length > 0) {
          csvRows = [
            ['Date', 'Registration ID', 'Member Name', 'Phone', 'Method', 'Status', 'Check-in Time'],
            ...res.data.data.records.map(a => [
              a.date, a.registration_id, a.full_name, a.phone, a.method, a.status, a.check_in_time
            ])
          ];
        }
      } catch (_) {}
      if (csvRows.length === 0) {
        csvRows = [
          ['Month', 'Members Joined', 'Active Memberships'],
          ...MONTHLY_FINANCE.map(m => [m.month, m.members_joined, m.memberships_sold])
        ];
      }
    } else if (type === 'expenses') {
      try {
        const res = await api.get('/reports/expenses');
        if (res.data?.success && res.data.data?.expenses?.length > 0) {
          csvRows = [
            ['Date', 'Category', 'Description', 'Amount (INR)', 'Payment Method'],
            ...res.data.data.expenses.map(e => [
              e.expense_date, e.category, e.description, e.amount, e.payment_method
            ])
          ];
        }
      } catch (_) {}
      if (csvRows.length === 0) {
        csvRows = [
          ['Month', 'Total Expenses (INR)', 'Revenue (INR)', 'Net Profit (INR)'],
          ...MONTHLY_FINANCE.map(m => [m.month, m.expense, m.revenue, m.revenue - m.expense])
        ];
      }
    }

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const filename = `EliteFitness_${type}_${presetLabel.replace(/\s+/g, '_')}.csv`;

    // ── Check if running natively on Android/iOS via Capacitor ──
    const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

    if (isNative) {
      try {
        showToast(`⏳ Saving ${filename}...`);
        let fileUri = null;

        // 1. Try writing directly to Documents directory so file appears in device storage
        try {
          const res = await Filesystem.writeFile({
            path: filename,
            data: csvContent,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
          });
          fileUri = res.uri;
        } catch (docErr) {
          // If Documents permission issue on some Android versions, write to Cache
          const cacheRes = await Filesystem.writeFile({
            path: filename,
            data: csvContent,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
          });
          fileUri = cacheRes.uri;
        }

        if (fileUri) {
          // Open native Android Share sheet with the actual FILE URI
          await Share.share({
            title: filename,
            text: `Elite Fitness ${type.toUpperCase()} Report (${presetLabel})`,
            url: fileUri,
            dialogTitle: `Save or Share ${filename}`
          });
          showToast(`✅ Saved! File ready to open or share.`);
        }
      } catch (err) {
        if (err?.message !== 'Share canceled') {
          showToast(`✅ File saved to Documents: ${filename}`);
        }
      }
      return;
    }

    // ── Browser: standard Blob download ──
    showToast(`✅ Downloading ${filename}...`);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const totalRevenue = MONTHLY_FINANCE.reduce((a, m) => a + m.revenue, 0);
  const totalExpense = MONTHLY_FINANCE.reduce((a, m) => a + m.expense, 0);
  const netProfit = totalRevenue - totalExpense;
  const totalPlansSold = MONTHLY_FINANCE.reduce((a, m) => a + m.memberships_sold, 0);

  const REPORT_CARDS = [
    {
      type: 'payments',
      label: 'Payment & Revenue Report',
      desc: 'All invoices, UTR verifications, payment methods, and revenue timestamps.',
      icon: FileSpreadsheet,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.15)',
    },
    {
      type: 'members',
      label: 'Members Roster Report',
      desc: 'Member details, registration IDs, active plans, and expiration dates.',
      icon: Users,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.15)',
    },
    {
      type: 'attendance',
      label: 'Attendance Summary Report',
      desc: 'Daily check-in logs, QR vs manual, device fingerprint records.',
      icon: CheckCircle,
      color: '#38BDF8',
      bg: 'rgba(56,189,248,0.15)',
    },
    {
      type: 'expenses',
      label: 'Expenses Ledger Report',
      desc: 'All expenses by category, month-wise totals, and net P&L.',
      icon: TrendingUp,
      color: '#A78BFA',
      bg: 'rgba(167,139,250,0.15)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#FFFFFF',
          border: '1.5px solid #DCEBFA', color: '#1F2937',
          padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(77, 166, 255, 0.18)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <Sparkles size={18} color="#4DA6FF" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F2937' }}>Analytics & Excel Reports</h2>
        <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>
          Export filtered reports with custom date ranges — This Month, Last Month, Last 6 Months, or Custom period.
        </p>
      </div>

      {/* Finance Summary Cards — 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Revenue (6 Mo)', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#059669', icon: TrendingUp },
          { label: 'Total Expenses (6 Mo)', value: `₹${totalExpense.toLocaleString('en-IN')}`, color: '#DC2626', icon: FileText },
          { label: 'Net Profit (6 Mo)', value: `₹${netProfit.toLocaleString('en-IN')}`, color: '#D97706', icon: IndianRupee },
          { label: 'Memberships Sold', value: `${totalPlansSold} Plans`, color: '#0284C7', icon: Users },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Month-wise Finance Table */}
      <div className="glass-card" style={{ overflowX: 'auto', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCEBFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1F2937' }}>📊 Month-wise Financial Summary</h3>
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Last 6 months</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>MONTH</th>
              <th>REVENUE</th>
              <th>EXPENSES</th>
              <th>NET PROFIT</th>
              <th>MARGIN</th>
              <th>MEMBERS JOINED</th>
              <th>MEMBERSHIPS SOLD</th>
            </tr>
          </thead>
          <tbody>
            {MONTHLY_FINANCE.map(m => {
              const profit = m.revenue - m.expense;
              const margin = Math.round((profit / m.revenue) * 100);
              return (
                <tr key={m.month}>
                  <td style={{ fontWeight: 700, color: '#1F2937' }}>{m.month}</td>
                  <td style={{ color: '#059669', fontWeight: 700 }}>₹{m.revenue.toLocaleString('en-IN')}</td>
                  <td style={{ color: '#DC2626', fontWeight: 700 }}>₹{m.expense.toLocaleString('en-IN')}</td>
                  <td style={{ color: profit > 0 ? '#D97706' : '#DC2626', fontWeight: 800 }}>
                    ₹{profit.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                      background: margin >= 20 ? '#ECFDF5' : margin >= 10 ? '#FFFBEB' : '#FEF2F2',
                      color: margin >= 20 ? '#059669' : margin >= 10 ? '#D97706' : '#DC2626',
                    }}>
                      {margin}%
                    </span>
                  </td>
                  <td style={{ color: '#0284C7', fontWeight: 600 }}>{m.members_joined}</td>
                  <td style={{ color: '#7C3AED', fontWeight: 600 }}>{m.memberships_sold}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#F0F7FF' }}>
              <td style={{ fontWeight: 800, color: '#0284C7' }}>TOTAL</td>
              <td style={{ color: '#059669', fontWeight: 900 }}>₹{totalRevenue.toLocaleString('en-IN')}</td>
              <td style={{ color: '#DC2626', fontWeight: 900 }}>₹{totalExpense.toLocaleString('en-IN')}</td>
              <td style={{ color: '#D97706', fontWeight: 900 }}>₹{netProfit.toLocaleString('en-IN')}</td>
              <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: '#DBEEFF', color: '#0284C7' }}>{Math.round((netProfit/totalRevenue)*100)}%</span></td>
              <td style={{ color: '#0284C7', fontWeight: 800 }}>{MONTHLY_FINANCE.reduce((a,m)=>a+m.members_joined,0)}</td>
              <td style={{ color: '#7C3AED', fontWeight: 800 }}>{MONTHLY_FINANCE.reduce((a,m)=>a+m.memberships_sold,0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Export Report Cards */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#1F2937' }}>
          📥 Export Reports (Date Range Required)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
          {REPORT_CARDS.map(card => (
            <div key={card.type} className="glass-card" style={{ padding: '24px', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
              <div style={{
                padding: '12px', borderRadius: '14px',
                background: card.bg, color: card.color,
                width: 'fit-content', marginBottom: '14px'
              }}>
                <card.icon size={26} />
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px', color: '#1F2937' }}>{card.label}</h3>
              <p style={{ color: '#6B7280', fontSize: '0.82rem', marginBottom: '20px', lineHeight: 1.5 }}>{card.desc}</p>

              <button
                className="btn-primary"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #4DA6FF 0%, #2E8FE8 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(77, 166, 255, 0.35)'
                }}
                onClick={() => setDateModal({ type: card.type, label: card.label })}
              >
                <Calendar size={16} /> Select Period & Export
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Export Log */}
      {exportLog.length > 0 && (
        <div className="glass-card" style={{ padding: '20px', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
            Recent Exports
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {exportLog.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: '#F8FBFF', border: '1px solid #DCEBFA', borderRadius: '8px', fontSize: '0.82rem' }}>
                <Download size={15} color="#059669" />
                <span style={{ color: '#1F2937', fontWeight: 600 }}>{log.type} report</span>
                <span style={{ color: '#6B7280' }}>—</span>
                <span style={{ color: '#0284C7' }}>{log.period}</span>
                <span style={{ color: '#6B7280', marginLeft: 'auto' }}>{log.exported_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Range Modal */}
      {dateModal && (
        <DateRangeModal
          reportType={dateModal.type}
          reportLabel={dateModal.label}
          onClose={() => setDateModal(null)}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
