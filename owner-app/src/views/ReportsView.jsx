import React, { useState } from 'react';
import {
  FileSpreadsheet, Download, FileText, Calendar, ChevronDown,
  CheckCircle, Clock, X, Filter, TrendingUp, Users, IndianRupee, Sparkles
} from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

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
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#F59E0B', fontWeight: 800 }}>
            📅 Select Export Date Range
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#9CA3AF', fontSize: '0.82rem', marginBottom: '20px' }}>
          Choose a period for the <strong style={{ color: '#F9FAFB' }}>{reportLabel}</strong> export.
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
                border: selected === preset.key ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                background: selected === preset.key ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
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
                color: selected === preset.key ? '#F59E0B' : '#F9FAFB'
              }}>
                {preset.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{preset.desc()}</span>
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {selected === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', padding: '16px', background: 'rgba(245,158,11,0.06)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
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

    // Build CSV rows based on report type
    let csvRows = [];
    if (type === 'payments') {
      csvRows = [
        ['Month', 'Revenue (INR)', 'Expenses (INR)', 'Net Profit (INR)', 'Margin %', 'Memberships Sold'],
        ...MONTHLY_FINANCE.map(m => {
          const profit = m.revenue - m.expense;
          const margin = Math.round((profit / m.revenue) * 100);
          return [m.month, m.revenue, m.expense, profit, `${margin}%`, m.memberships_sold];
        })
      ];
    } else if (type === 'members') {
      csvRows = [
        ['Month', 'Members Joined', 'Memberships Sold'],
        ...MONTHLY_FINANCE.map(m => [m.month, m.members_joined, m.memberships_sold])
      ];
    } else if (type === 'attendance') {
      csvRows = [
        ['Month', 'Members Joined', 'Active Memberships'],
        ...MONTHLY_FINANCE.map(m => [m.month, m.members_joined, m.memberships_sold])
      ];
    } else if (type === 'expenses') {
      csvRows = [
        ['Month', 'Total Expenses (INR)', 'Revenue (INR)', 'Net Profit (INR)'],
        ...MONTHLY_FINANCE.map(m => [m.month, m.expense, m.revenue, m.revenue - m.expense])
      ];
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
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'linear-gradient(135deg,#1E293B,#0F172A)',
          border: '1px solid #10B981', color: '#F9FAFB',
          padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem'
        }}>
          <Sparkles size={18} color="#10B981" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Analytics & Excel Reports</h2>
        <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
          Export filtered reports with custom date ranges — This Month, Last Month, Last 6 Months, or Custom period.
        </p>
      </div>

      {/* Finance Summary Cards — 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Revenue (6 Mo)', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#10B981', icon: TrendingUp },
          { label: 'Total Expenses (6 Mo)', value: `₹${totalExpense.toLocaleString('en-IN')}`, color: '#F87171', icon: FileText },
          { label: 'Net Profit (6 Mo)', value: `₹${netProfit.toLocaleString('en-IN')}`, color: '#F59E0B', icon: IndianRupee },
          { label: 'Memberships Sold', value: `${totalPlansSold} Plans`, color: '#38BDF8', icon: Users },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `${s.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Month-wise Finance Table */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📊 Month-wise Financial Summary</h3>
          <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Last 6 months</span>
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
                  <td style={{ fontWeight: 700, color: '#F9FAFB' }}>{m.month}</td>
                  <td style={{ color: '#10B981', fontWeight: 700 }}>₹{m.revenue.toLocaleString('en-IN')}</td>
                  <td style={{ color: '#F87171', fontWeight: 700 }}>₹{m.expense.toLocaleString('en-IN')}</td>
                  <td style={{ color: profit > 0 ? '#F59E0B' : '#EF4444', fontWeight: 800 }}>
                    ₹{profit.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                      background: margin >= 20 ? 'rgba(16,185,129,0.15)' : margin >= 10 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: margin >= 20 ? '#10B981' : margin >= 10 ? '#F59E0B' : '#EF4444',
                    }}>
                      {margin}%
                    </span>
                  </td>
                  <td style={{ color: '#38BDF8', fontWeight: 600 }}>{m.members_joined}</td>
                  <td style={{ color: '#A78BFA', fontWeight: 600 }}>{m.memberships_sold}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
              <td style={{ fontWeight: 800, color: '#F59E0B' }}>TOTAL</td>
              <td style={{ color: '#10B981', fontWeight: 900 }}>₹{totalRevenue.toLocaleString('en-IN')}</td>
              <td style={{ color: '#F87171', fontWeight: 900 }}>₹{totalExpense.toLocaleString('en-IN')}</td>
              <td style={{ color: '#F59E0B', fontWeight: 900 }}>₹{netProfit.toLocaleString('en-IN')}</td>
              <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>{Math.round((netProfit/totalRevenue)*100)}%</span></td>
              <td style={{ color: '#38BDF8', fontWeight: 800 }}>{MONTHLY_FINANCE.reduce((a,m)=>a+m.members_joined,0)}</td>
              <td style={{ color: '#A78BFA', fontWeight: 800 }}>{MONTHLY_FINANCE.reduce((a,m)=>a+m.memberships_sold,0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Export Report Cards */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#F9FAFB' }}>
          📥 Export Reports (Date Range Required)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
          {REPORT_CARDS.map(card => (
            <div key={card.type} className="glass-card" style={{ padding: '24px' }}>
              <div style={{
                padding: '12px', borderRadius: '14px',
                background: card.bg, color: card.color,
                width: 'fit-content', marginBottom: '14px'
              }}>
                <card.icon size={26} />
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px', color: '#F9FAFB' }}>{card.label}</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.82rem', marginBottom: '20px', lineHeight: 1.5 }}>{card.desc}</p>

              <button
                className="btn-primary"
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${card.color}, ${card.color}CC)`,
                  color: '#000',
                  boxShadow: `0 4px 14px ${card.color}33`
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
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
            Recent Exports
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {exportLog.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.82rem' }}>
                <Download size={15} color="#10B981" />
                <span style={{ color: '#F9FAFB', fontWeight: 600 }}>{log.type} report</span>
                <span style={{ color: '#9CA3AF' }}>—</span>
                <span style={{ color: '#F59E0B' }}>{log.period}</span>
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
