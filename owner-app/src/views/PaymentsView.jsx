import React, { useState, useEffect } from 'react';
import {
  DollarSign, ArrowDownRight, ArrowUpRight, Plus, X,
  CheckCircle, XCircle, Clock, AlertCircle, Hash, User,
  CreditCard, Wallet, Sparkles, RefreshCw, TrendingUp
} from 'lucide-react';
import api from '../api';

const MOCK_PAYMENTS = [
  { id: '1', invoice_number: 'EF-INV-9901', member_name: 'Rahul Sharma', plan: 'Quarterly Beast Mode', amount: 2699, method: 'UPI', status: 'SUCCESS', date: '2026-09-18' },
  { id: '2', invoice_number: 'EF-INV-9902', member_name: 'Priya Verma', plan: 'Monthly Pass', amount: 999, method: 'CASH', status: 'SUCCESS', date: '2026-09-17' },
  { id: '3', invoice_number: 'EF-INV-9903', member_name: 'Sneha Gupta', plan: 'Annual Champion', amount: 8999, method: 'UPI', status: 'SUCCESS', date: '2026-09-15' },
];

const MOCK_EXPENSES = [
  { id: 'e1', title: 'Monthly Gym Rent', category: 'Rent', amount: 45000, date: '2026-09-05' },
  { id: 'e2', title: 'Trainer Salaries', category: 'Salary', amount: 60000, date: '2026-09-01' },
  { id: 'e3', title: 'Cardio Equipment Maintenance', category: 'Maintenance', amount: 8500, date: '2026-09-10' },
];

// Mock UTR pending verifications from member submissions
const MOCK_UTR_REQUESTS = [
  {
    id: 'utr1',
    member_name: 'Amit Patel',
    reg_id: 'EF26091003',
    plan: 'Monthly Pass',
    amount: 999,
    utr_number: 'UTR123456789012',
    proof_note: 'Paid via PhonePe to your UPI ID',
    submitted_at: '2026-09-21T10:30:00Z',
    status: 'PENDING'
  },
  {
    id: 'utr2',
    member_name: 'Vikram Singh',
    reg_id: 'EF26091005',
    plan: 'Half-Yearly Elite Pass',
    amount: 4999,
    utr_number: 'UTR987654321098',
    proof_note: 'Paid via Google Pay',
    submitted_at: '2026-09-21T08:15:00Z',
    status: 'PENDING'
  },
];

const MONTHLY_FINANCE = [
  { month: 'Apr 2026', revenue: 142500, expense: 115000 },
  { month: 'May 2026', revenue: 158000, expense: 118500 },
  { month: 'Jun 2026', revenue: 134000, expense: 112000 },
  { month: 'Jul 2026', revenue: 172000, expense: 122000 },
  { month: 'Aug 2026', revenue: 189500, expense: 125000 },
  { month: 'Sep 2026', revenue: 178500, expense: 119000 },
];

export default function PaymentsView() {
  const [payments] = useState(MOCK_PAYMENTS);
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  // Track which UTR IDs have been locally verified/rejected (persists across app restarts)
  const [localStatusOverrides, setLocalStatusOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ef_utr_statuses') || '{}');
    } catch { return {}; }
  });

  // Synchronously compute initial UTR list with local storage & overrides merged immediately
  const [utrRequests, setUtrRequests] = useState(() => {
    try {
      const overrides = JSON.parse(localStorage.getItem('ef_utr_statuses') || '{}');
      let baseList = [...MOCK_UTR_REQUESTS];
      const locallySubmitted = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
      if (locallySubmitted.length > 0) {
        baseList = [...locallySubmitted, ...MOCK_UTR_REQUESTS];
      }
      const seen = new Set();
      const deduped = [];
      for (const item of baseList) {
        const key = item.utr_number || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          const effectiveStatus = overrides[item.id] || item.status;
          deduped.push({ ...item, status: effectiveStatus });
        }
      }
      return deduped;
    } catch {
      return MOCK_UTR_REQUESTS;
    }
  });

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // { id, member_name }
  const [rejectReason, setRejectReason] = useState('');
  const [newExpense, setNewExpense] = useState({ title: '', category: 'Rent', amount: '' });
  const [processingId, setProcessingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [activeTab, setActiveTab] = useState('utr'); // 'utr' | 'invoices' | 'expenses' | 'monthly'

  // Merge local overrides into request list
  const mergeOverrides = (requests, overrides) =>
    requests.map(r => ({
      ...r,
      status: overrides[r.id] || r.status
    }));

  const applyLocalOverride = (id, status) => {
    const updated = { ...localStatusOverrides, [id]: status };
    setLocalStatusOverrides(updated);
    localStorage.setItem('ef_utr_statuses', JSON.stringify(updated));
    setUtrRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const totalIncome = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;
  // Count both pending UTR and cash collection requests
  const pendingUTRCount = utrRequests.filter(r => {
    const override = localStatusOverrides[r.id];
    const effectiveStatus = override || r.status;
    return effectiveStatus === 'PENDING' || effectiveStatus === 'PENDING_CASH';
  }).length;

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Try to load real UTR requests from backend and combine with persistent local submissions
  useEffect(() => {
    async function loadRequests() {
      let baseList = [...MOCK_UTR_REQUESTS];
      try {
        const locallySubmitted = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
        if (locallySubmitted.length > 0) {
          baseList = [...locallySubmitted, ...MOCK_UTR_REQUESTS];
        }
      } catch (e) {}

      try {
        const res = await api.get('/payment-requests?status=PENDING');
        if (res.data?.success && res.data?.data?.length > 0) {
          const fetched = res.data.data.map(r => ({
            id: String(r.id),
            member_name: r.member_name || r.full_name || 'Member',
            reg_id: r.registration_id || 'N/A',
            plan: r.plan_name || 'Membership Plan',
            amount: parseFloat(r.amount) || 0,
            utr_number: r.utr_number || 'Not Provided',
            proof_note: r.proof_note || '',
            submitted_at: r.submitted_at || r.created_at,
            status: r.status || 'PENDING'
          }));
          baseList = [...baseList, ...fetched];
        }
      } catch (err) {
        // Backend offline — use local list
      }

      // Deduplicate by utr_number or id
      const seen = new Set();
      const deduped = [];
      for (const item of baseList) {
        const key = item.utr_number || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }

      const overrides = JSON.parse(localStorage.getItem('ef_utr_statuses') || '{}');
      setUtrRequests(mergeOverrides(deduped, overrides));
    }
    loadRequests();
  }, []);

  // Verify a UTR payment — marks membership ACTIVE
  const handleVerify = async (requestId) => {
    setProcessingId(requestId);
    const req = utrRequests.find(r => r.id === requestId);

    // Persist locally first — won't revert on tab switch or re-fetch
    applyLocalOverride(requestId, 'VERIFIED');
    showToast(`✅ UTR verified for ${req?.member_name || 'Member'}! Membership activated.`, 'success');

    try {
      const stored = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
      const updatedStored = stored.map(s => s.id === requestId ? { ...s, status: 'VERIFIED' } : s);
      localStorage.setItem('ef_submitted_utr_requests', JSON.stringify(updatedStored));
      
      const customMembers = JSON.parse(localStorage.getItem('ef_custom_members') || '[]');
      const updatedMembers = customMembers.map(m =>
        (m.registration_id === req?.reg_id || m.full_name === req?.member_name)
          ? { ...m, status: 'ACTIVE', payment_status: 'PAID' }
          : m
      );
      localStorage.setItem('ef_custom_members', JSON.stringify(updatedMembers));
    } catch (e) {}

    try {
      await api.post(`/payment-requests/${requestId}/verify`);
    } catch (err) {
      console.log('Backend verify note:', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Reject a UTR payment
  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessingId(rejectModal.id);
    const req = utrRequests.find(r => r.id === rejectModal.id);

    // Persist locally — won't revert on tab switch or re-fetch
    applyLocalOverride(rejectModal.id, 'REJECTED');
    showToast(`Payment request rejected for ${req?.member_name || 'Member'}.`, 'danger');

    try {
      const stored = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
      const updatedStored = stored.map(s => s.id === rejectModal.id ? { ...s, status: 'REJECTED' } : s);
      localStorage.setItem('ef_submitted_utr_requests', JSON.stringify(updatedStored));
    } catch (e) {}

    setRejectModal(null);
    setRejectReason('');

    try {
      await api.post(`/payment-requests/${rejectModal.id}/reject`, { rejection_reason: rejectReason });
    } catch (err) {
      console.log('Backend reject note:', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    setExpenses([{
      id: String(Date.now()),
      ...newExpense,
      amount: Number(newExpense.amount),
      date: new Date().toISOString().split('T')[0]
    }, ...expenses]);
    setShowAddExpense(false);
    showToast('Expense recorded successfully!');
    setNewExpense({ title: '', category: 'Rent', amount: '' });
  };

  const formatTime = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const tabs = [
    { id: 'utr', label: 'UTR Verifications', badge: pendingUTRCount },
    { id: 'invoices', label: 'Payment Invoices' },
    { id: 'expenses', label: 'Expense Ledger' },
    { id: 'monthly', label: '📊 Monthly Breakdown' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          border: `1px solid ${toastType === 'success' ? '#10B981' : '#EF4444'}`,
          color: '#F9FAFB',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem'
        }}>
          {toastType === 'success' ? <Sparkles size={18} color="#10B981" /> : <XCircle size={18} color="#EF4444" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Finance & Payment Management</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
            UTR verification queue, invoices, expenses, and net profit overview.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setShowAddExpense(true)}>
            <Plus size={18} /> Record Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowDownRight size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Total Revenue</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981' }}>₹{totalIncome.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowUpRight size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Total Expenses</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#EF4444' }}>₹{totalExpense.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Net Profit</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>
              ₹{netProfit.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderColor: pendingUTRCount > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}
          onClick={() => setActiveTab('utr')}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <Clock size={22} />
            {pendingUTRCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#EF4444', color: '#fff',
                borderRadius: '999px', width: '18px', height: '18px',
                fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{pendingUTRCount}</span>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Pending UTR Queue</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: pendingUTRCount > 0 ? '#F59E0B' : '#9CA3AF' }}>
              {pendingUTRCount} Requests
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (Scrollable on phones) */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '0',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        maxWidth: '100%'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #F59E0B' : '2px solid transparent',
              color: activeTab === tab.id ? '#F59E0B' : '#9CA3AF',
              fontWeight: 700,
              fontSize: '0.88rem',
              padding: '10px 18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              marginBottom: '-1px'
            }}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span style={{
                background: '#EF4444', color: '#fff',
                borderRadius: '999px', padding: '1px 6px',
                fontSize: '0.72rem', fontWeight: 800
              }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* UTR & Cash Verification Panel */}
      {activeTab === 'utr' && (() => {
        const pendingList = utrRequests.filter(r => {
          const s = localStatusOverrides[r.id] || r.status;
          return s === 'PENDING' || s === 'PENDING_CASH';
        });
        const processedList = utrRequests.filter(r => {
          const s = localStatusOverrides[r.id] || r.status;
          return s !== 'PENDING' && s !== 'PENDING_CASH';
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Pending Requests Queue */}
            {pendingList.length === 0 ? (
              <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
                <CheckCircle size={40} color="#10B981" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#F9FAFB' }}>All Clear!</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '4px' }}>
                  No pending UTR verifications or cash collections at this moment.
                </div>
              </div>
            ) : (
              pendingList.map((req) => {
                const isCash = req.method === 'CASH' || req.status === 'PENDING_CASH' || req.utr_number === 'CASH-PAYMENT-DUE';

                return (
                  <div
                    key={req.id}
                    className="glass-card"
                    style={{
                      padding: '20px',
                      border: isCash ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(245, 158, 11, 0.35)',
                      background: 'rgba(15, 23, 42, 0.85)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      {/* Left block */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: isCash
                              ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.15))'
                              : 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))',
                            border: '1px solid rgba(245,158,11,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, color: '#F59E0B', fontSize: '0.85rem', fontFamily: 'Outfit,sans-serif'
                          }}>
                            {req.member_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#F9FAFB' }}>{req.member_name}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#F59E0B' }}>{req.reg_id}</div>
                          </div>

                          {isCash ? (
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: 'rgba(245,158,11,0.2)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245,158,11,0.4)'
                            }}>
                              💵 CASH DUE AT RECEPTION
                            </span>
                          ) : (
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: 'rgba(245,158,11,0.15)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245,158,11,0.3)'
                            }}>
                              PENDING VERIFICATION
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginTop: '8px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                              Plan
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{req.plan}</div>
                          </div>

                          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                              {isCash ? 'Cash to Collect' : 'Amount Paid'}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: isCash ? '#F59E0B' : '#10B981' }}>
                              ₹{req.amount.toLocaleString('en-IN')}
                            </div>
                          </div>

                          <div style={{ background: isCash ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                              {isCash ? 'Payment Mode' : 'UTR Number'}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: isCash ? '#10B981' : '#F59E0B', letterSpacing: '0.03em' }}>
                              {isCash ? 'Cash at Counter' : req.utr_number}
                            </div>
                          </div>

                          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                              Submitted At
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#D1D5DB' }}>{formatTime(req.submitted_at)}</div>
                          </div>
                        </div>

                        {req.proof_note && (
                          <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px', fontStyle: 'italic' }}>
                            Note: "{req.proof_note}"
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
                        <button
                          className="btn-primary"
                          style={{
                            padding: '9px 18px',
                            fontSize: '0.83rem',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                            gap: '6px'
                          }}
                          onClick={() => handleVerify(req.id)}
                          disabled={processingId === req.id}
                        >
                          <CheckCircle size={16} />
                          {processingId === req.id
                            ? 'Activating...'
                            : isCash
                              ? 'Collect Cash & Activate ✓'
                              : 'Verify UTR ✓'}
                        </button>

                        <button
                          className="btn-secondary"
                          style={{
                            padding: '9px 18px',
                            fontSize: '0.83rem',
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            color: '#F87171',
                            gap: '6px'
                          }}
                          onClick={() => setRejectModal({ id: req.id, member_name: req.member_name })}
                          disabled={processingId === req.id}
                        >
                          <XCircle size={16} />
                          Reject ✗
                        </button>

                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textAlign: 'center' }}>
                          {isCash ? 'Collect cash before activating' : 'Match UTR before verifying'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Verified & Processed UTR History */}
            {processedList.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Verified & Processed Payments ({processedList.length})
                  </span>
                </div>
                {processedList.map((req) => (
                  <div
                    key={req.id}
                    className="glass-card"
                    style={{
                      padding: '14px 18px',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      background: 'rgba(16, 185, 129, 0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F9FAFB' }}>{req.member_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#F59E0B' }}>{req.reg_id}</span>
                        <span>•</span>
                        <span>{req.plan}</span>
                        <span>•</span>
                        <span style={{ fontFamily: 'monospace' }}>UTR: {req.utr_number}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#10B981' }}>
                        ₹{req.amount.toLocaleString('en-IN')}
                      </span>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: req.status === 'VERIFIED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: req.status === 'VERIFIED' ? '#10B981' : '#EF4444',
                        border: `1px solid ${req.status === 'VERIFIED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                      }}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>Payment Invoices</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>INVOICE #</th>
                <th>MEMBER NAME</th>
                <th>PLAN</th>
                <th>AMOUNT</th>
                <th>METHOD</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#F59E0B' }}>{p.invoice_number}</td>
                  <td style={{ fontWeight: 600 }}>{p.member_name}</td>
                  <td>{p.plan}</td>
                  <td style={{ color: '#10B981', fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                  <td><span className="status-badge status-frozen">{p.method}</span></td>
                  <td>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F87171' }}>Expense Ledger</h3>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setShowAddExpense(true)}>
              <Plus size={16} /> Add Expense
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>EXPENSE TITLE</th>
                <th>CATEGORY</th>
                <th>AMOUNT</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>{e.title}</td>
                  <td><span className="status-badge status-frozen">{e.category}</span></td>
                  <td style={{ color: '#F87171', fontWeight: 700 }}>₹{e.amount.toLocaleString('en-IN')}</td>
                  <td>{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly Breakdown Tab */}
      {activeTab === 'monthly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Month mini-cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {MONTHLY_FINANCE.map(m => {
              const profit = m.revenue - m.expense;
              const margin = Math.round((profit / m.revenue) * 100);
              return (
                <div key={m.month} className="glass-card" style={{ padding: '16px 18px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#F59E0B', marginBottom: '10px' }}>{m.month}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Revenue</div>
                  <div style={{ fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>₹{m.revenue.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Expenses</div>
                  <div style={{ fontWeight: 800, color: '#F87171', marginBottom: '8px' }}>₹{m.expense.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Net Profit</div>
                  <div style={{ fontWeight: 900, color: profit >= 0 ? '#F59E0B' : '#EF4444', marginBottom: '8px' }}>₹{profit.toLocaleString('en-IN')}</div>
                  {/* Margin bar */}
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${margin}%`, height: '100%', background: margin >= 20 ? '#10B981' : margin >= 10 ? '#F59E0B' : '#EF4444', borderRadius: '999px' }} />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '4px' }}>Margin: {margin}%</div>
                </div>
              );
            })}
          </div>

          {/* Summary Table */}
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F9FAFB' }}>Month-wise Finance Summary (Last 6 Months)</h3>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>MONTH</th>
                  <th>REVENUE</th>
                  <th>EXPENSES</th>
                  <th>NET PROFIT</th>
                  <th>PROFIT MARGIN</th>
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
                      <td style={{ color: profit >= 0 ? '#F59E0B' : '#EF4444', fontWeight: 800 }}>₹{profit.toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          background: margin >= 20 ? 'rgba(16,185,129,0.15)' : margin >= 10 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                          color: margin >= 20 ? '#10B981' : margin >= 10 ? '#F59E0B' : '#EF4444',
                        }}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td style={{ fontWeight: 800, color: '#F59E0B' }}>TOTAL (6 Mo)</td>
                  <td style={{ color: '#10B981', fontWeight: 900 }}>₹{MONTHLY_FINANCE.reduce((a,m)=>a+m.revenue,0).toLocaleString('en-IN')}</td>
                  <td style={{ color: '#F87171', fontWeight: 900 }}>₹{MONTHLY_FINANCE.reduce((a,m)=>a+m.expense,0).toLocaleString('en-IN')}</td>
                  <td style={{ color: '#F59E0B', fontWeight: 900 }}>₹{(MONTHLY_FINANCE.reduce((a,m)=>a+m.revenue,0)-MONTHLY_FINANCE.reduce((a,m)=>a+m.expense,0)).toLocaleString('en-IN')}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Avg: {Math.round(MONTHLY_FINANCE.reduce((a,m)=>a+Math.round(((m.revenue-m.expense)/m.revenue)*100),0)/MONTHLY_FINANCE.length)}%</span></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#F87171', fontWeight: 800 }}>Reject Payment Request</h3>
              <X size={20} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setRejectModal(null)} />
            </div>

            <div style={{ marginBottom: '16px', color: '#D1D5DB', fontSize: '0.9rem' }}>
              Rejecting payment from <strong style={{ color: '#F9FAFB' }}>{rejectModal.member_name}</strong>.
              This will NOT activate their membership. Provide a reason for the member:
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="label">Rejection Reason (Optional)</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="e.g. UTR number mismatch, amount incorrect..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setRejectModal(null)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.9rem'
                }}
              >
                <XCircle size={18} /> Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#F59E0B', fontWeight: 800 }}>Record New Expense</h3>
              <X size={20} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setShowAddExpense(false)} />
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Expense Description *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Electricity Bill August"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input-field"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  >
                    <option value="Rent">Rent</option>
                    <option value="Salary">Salary</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 12000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddExpense(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
