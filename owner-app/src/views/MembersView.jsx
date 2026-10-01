import React, { useState, useEffect } from 'react';
import {
  Search, UserPlus, Filter, ShieldCheck, Snowflake, CheckCircle,
  AlertCircle, XCircle, ChevronDown, Phone, Mail, Calendar,
  CreditCard, Award, X, Sparkles, QrCode, Check, Trash2, ArrowRight, ArrowLeft, RefreshCw
} from 'lucide-react';
import api from '../api';
import { fetchCloudEvents, subscribeCloudStream, publishCloudEvent } from '../utils/cloudSync';

const INITIAL_MEMBERS = [
  {
    id: '1',
    registration_id: 'EF26091001',
    full_name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    status: 'ACTIVE',
    plan_name: 'Quarterly Beast Mode',
    end_date: '2026-12-15',
    payment_status: 'PAID',
    amount_paid: '₹2,699'
  },
  {
    id: '2',
    registration_id: 'EF26091002',
    full_name: 'Priya Verma',
    phone: '9812345678',
    email: 'priya@example.com',
    status: 'ACTIVE',
    plan_name: 'Monthly Pass',
    end_date: '2026-10-18',
    payment_status: 'PAID',
    amount_paid: '₹999'
  },
  {
    id: '3',
    registration_id: 'EF26091003',
    full_name: 'Amit Patel',
    phone: '9765432109',
    email: 'amit@example.com',
    status: 'EXPIRED',
    plan_name: 'Monthly Pass',
    end_date: '2026-09-01',
    payment_status: 'DUE',
    amount_paid: '₹0'
  },
  {
    id: '4',
    registration_id: 'EF26091004',
    full_name: 'Sneha Gupta',
    phone: '9988776655',
    email: 'sneha@example.com',
    status: 'FROZEN',
    plan_name: 'Annual Champion',
    end_date: '2027-04-20',
    payment_status: 'PAID',
    amount_paid: '₹8,999'
  },
  {
    id: '5',
    registration_id: 'EF26091005',
    full_name: 'Vikram Singh',
    phone: '9123456789',
    email: 'vikram@example.com',
    status: 'INACTIVE',
    plan_name: 'Half-Yearly Elite Pass',
    end_date: '2026-08-10',
    payment_status: 'PENDING',
    amount_paid: '₹4,999'
  },
  {
    id: '6',
    registration_id: 'EF26091006',
    full_name: 'Ananya Deshmukh',
    phone: '9845123456',
    email: 'ananya@example.com',
    status: 'ACTIVE',
    plan_name: 'Annual Champion',
    end_date: '2027-08-30',
    payment_status: 'PAID',
    amount_paid: '₹8,999'
  }
];

const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Active',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: CheckCircle
  },
  FROZEN: {
    label: 'Frozen',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Snowflake
  },
  EXPIRED: {
    label: 'Expired',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: AlertCircle
  },
  INACTIVE: {
    label: 'Inactive',
    color: '#9CA3AF',
    bg: 'rgba(156, 163, 175, 0.15)',
    border: 'rgba(156, 163, 175, 0.35)',
    icon: XCircle
  }
};

const PAYMENT_CONFIG = {
  PAID: { label: 'Paid', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  PENDING: { label: 'Pending UTR', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  DUE: { label: 'Payment Due', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

export default function MembersView({ setActiveTab }) {
  const [members, setMembers] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ef_custom_members') || '[]');
      if (stored.length > 0) {
        const map = new Map();
        [...stored, ...INITIAL_MEMBERS].forEach(m => {
          if (!map.has(m.id) && !map.has(m.registration_id)) {
            map.set(m.registration_id || m.id, m);
          }
        });
        return Array.from(map.values());
      }
    } catch (e) {}
    return INITIAL_MEMBERS;
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [openStatusId, setOpenStatusId] = useState(null); // which card has status dropdown open

  // Owner payment QR from settings
  const [paymentQrUrl, setPaymentQrUrl] = useState(() => {
    return localStorage.getItem('ef_payment_qr_url') || '';
  });
  const [paymentQrLabel, setPaymentQrLabel] = useState(() => {
    return localStorage.getItem('ef_payment_qr_label') || 'UPI Payment QR';
  });

  // Add Member Form state
  const [newMember, setNewMember] = useState({
    full_name: '',
    phone: '',
    email: '',
    plan_name: 'Quarterly Beast Mode',
    duration_months: 3,
    amount_paid: '₹2,699',
    payment_method: 'UPI', // 'UPI' | 'CASH'
    utr_number: '',
    proof_note: '',
    instant_verify: true // Owner can choose to verify now or send to Finance queue
  });

  // Load payment QR from settings API
  useEffect(() => {
    async function loadQr() {
      try {
        const res = await api.get('/settings/payment-qr');
        if (res.data?.success && res.data?.data?.payment_qr_url) {
          setPaymentQrUrl(res.data.data.payment_qr_url);
          if (res.data.data.payment_qr_label) setPaymentQrLabel(res.data.data.payment_qr_label);
          localStorage.setItem('ef_payment_qr_url', res.data.data.payment_qr_url);
        }
      } catch (err) {}
    }
    loadQr();
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  // Sync members and registrations from backend
  const loadMembers = async () => {
    setRefreshing(true);
    try {
      const [mRes, rRes] = await Promise.allSettled([
        api.get('/members?limit=100'),
        api.get('/registrations?limit=100')
      ]);

      const backendMembers = [];
      if (mRes.status === 'fulfilled') {
        const rows = Array.isArray(mRes.value.data?.data)
          ? mRes.value.data.data
          : (mRes.value.data?.data?.members || mRes.value.data?.members || []);
        rows.forEach(m => {
          const isInactive = m.status === 'INACTIVE' || m.payment_status === 'DUE' || m.payment_status === 'PENDING';
          backendMembers.push({
            id: String(m.id),
            registration_id: m.registration_id || `EF2609${m.id.toString().padStart(4, '0')}`,
            full_name: m.full_name || 'Member',
            phone: m.phone || 'N/A',
            email: m.email || '',
            status: isInactive ? 'INACTIVE' : (m.status || 'ACTIVE'),
            plan_name: m.plan_name || 'Quarterly Beast Mode',
            end_date: m.end_date ? m.end_date.split('T')[0] : '2026-12-31',
            payment_status: m.payment_status || (isInactive ? 'DUE' : 'PAID'),
            amount_paid: m.amount_paid ? `₹${m.amount_paid}` : '₹2,699'
          });
        });
      }

      if (rRes.status === 'fulfilled' && rRes.value.data?.data) {
        const regs = Array.isArray(rRes.value.data.data) ? rRes.value.data.data : [];
        regs.forEach(r => {
          const isPaid = (r.payment_status === 'SUCCESS' || r.payment_status === 'PAID') &&
                         r.payment_status !== 'DUE' &&
                         r.status !== 'PENDING_CASH';
          backendMembers.push({
            id: String(r.id || r.registration_id),
            registration_id: r.registration_id,
            full_name: r.full_name,
            phone: r.phone || 'N/A',
            email: r.email || '',
            status: isPaid ? 'ACTIVE' : 'INACTIVE',
            plan_name: r.plan_name || 'Membership Pass',
            end_date: isPaid ? 'Active' : 'Payment Due at Desk',
            payment_status: isPaid ? 'PAID' : (r.payment_status || (r.payment_method === 'CASH' ? 'DUE' : 'PENDING')),
            amount_paid: r.amount ? `₹${r.amount}` : '₹2,500'
          });
        });
      }

      // Ingest cloud registrations submitted from GitHub Pages worldwide
      let cloudRegistrations = [];
      try {
        const cloudEvents = await fetchCloudEvents('24h');
        cloudRegistrations = cloudEvents
          .filter(e => e.event === 'NEW_REGISTRATION' && e.data)
          .map(e => e.data);
      } catch (_) {}

      const stored = JSON.parse(localStorage.getItem('ef_custom_members') || '[]');
      const map = new Map();
      stored.forEach(m => map.set(m.registration_id || m.id, m));

      // Add cloud registrations (strict INACTIVE until owner approval)
      cloudRegistrations.forEach(r => {
        const key = r.registration_id;
        if (!map.has(key)) {
          map.set(key, {
            id: String(r.registration_id || Date.now()),
            registration_id: r.registration_id,
            full_name: r.full_name || 'Member',
            phone: r.phone || 'N/A',
            email: r.email || '',
            status: 'INACTIVE',
            plan_name: r.plan_name || 'Membership Plan',
            end_date: r.end_date || 'Active',
            payment_status: r.payment_status || (r.payment_method === 'CASH' ? 'DUE' : 'PENDING'),
            amount_paid: `₹${r.amount || 0}`
          });
        }
      });

      backendMembers.forEach(m => {
        const key = m.registration_id || m.id;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, m);
        } else {
          // If payment is pending/due in backend, keep strict inactive status
          if (m.payment_status === 'DUE' || m.status === 'INACTIVE') {
            map.set(key, { ...existing, status: 'INACTIVE', payment_status: m.payment_status || 'DUE' });
          }
        }
      });
      [...INITIAL_MEMBERS].forEach(m => {
        if (!map.has(m.registration_id) && !map.has(m.id)) {
          map.set(m.registration_id || m.id, m);
        }
      });
      const finalMembers = Array.from(map.values());
      try { localStorage.setItem('ef_custom_members', JSON.stringify(finalMembers)); } catch(e){}
      setMembers(finalMembers);
    } catch (err) {
      console.warn('loadMembers note:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMembers();

    // Real-time SSE stream for instant 0ms notification when a new member registers on GitHub Pages
    const unsubscribe = subscribeCloudStream((msg) => {
      if (msg.event === 'NEW_REGISTRATION' && msg.data) {
        const d = msg.data;
        const isCash = d.payment_method === 'CASH';
        const newMemberItem = {
          id: String(d.registration_id || Date.now()),
          registration_id: d.registration_id,
          full_name: d.full_name || 'Member',
          phone: d.phone || 'N/A',
          email: d.email || '',
          status: 'INACTIVE', // Strictly INACTIVE until owner verifies
          plan_name: d.plan_name || 'Membership Plan',
          end_date: d.end_date || 'Payment Pending',
          payment_status: isCash ? 'DUE' : 'PENDING',
          amount_paid: `₹${d.amount || 0}`
        };

        setMembers(prev => {
          if (prev.some(m => m.registration_id === newMemberItem.registration_id)) return prev;
          const updated = [newMemberItem, ...prev];
          try { localStorage.setItem('ef_custom_members', JSON.stringify(updated)); } catch(e){}
          return updated;
        });

        showToast(`🎉 New Registration: ${d.full_name} (${d.registration_id}) — ${isCash ? 'Cash Due at Counter' : 'Pending UTR'}!`);
      }
    });

    const pollInterval = setInterval(() => loadMembers(), 10000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Instant Database Status Override Handler
  const handleUpdateStatus = async (memberId, newStatus) => {
    const target = members.find(m => m.id === memberId || m.registration_id === memberId);
    if (!target) return;

    // 1. Optimistic state update
    const updated = members.map(m => (m.id === memberId || m.registration_id === memberId) ? { ...m, status: newStatus, payment_status: newStatus === 'ACTIVE' ? 'PAID' : m.payment_status } : m);
    setMembers(updated);

    // 2. Persist to localStorage
    try {
      localStorage.setItem('ef_custom_members', JSON.stringify(updated));
    } catch (e) {}

    // Broadcast PAYMENT_VERIFIED event to customer's phone over cloud sync
    if (newStatus === 'ACTIVE') {
      publishCloudEvent('PAYMENT_VERIFIED', {
        reg_id: target.registration_id,
        member_name: target.full_name
      }).catch(() => {});
    }

    showToast(`Status updated to ${newStatus} for ${target.full_name}!`);

    // 3. Sync with backend API
    try {
      await api.patch(`/members/${memberId}/status`, { status: newStatus });
    } catch (err) {
      console.log('Backend status update note:', err.message);
    }
  };

  // Create New Member with UPI QR & UTR recording
  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!newMember.full_name.trim() || !newMember.phone.trim()) {
      showToast('Please enter member name and phone number.');
      return;
    }

    const isUpi = newMember.payment_method === 'UPI';
    const isVerified = !isUpi || newMember.instant_verify;
    const regId = `EF2609${Math.floor(Math.random() * 9000) + 1000}`;
    const amountNum = parseInt(newMember.amount_paid.replace(/[^0-9]/g, '')) || 2699;

    const created = {
      id: String(Date.now()),
      registration_id: regId,
      full_name: newMember.full_name.trim(),
      phone: newMember.phone.trim(),
      email: newMember.email.trim(),
      status: isVerified ? 'ACTIVE' : 'INACTIVE',
      plan_name: newMember.plan_name,
      payment_status: isVerified ? 'PAID' : 'PENDING',
      amount_paid: newMember.amount_paid,
      end_date: new Date(Date.now() + newMember.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    const newMemberList = [created, ...members];
    setMembers(newMemberList);

    // Save to custom members in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('ef_custom_members') || '[]');
      localStorage.setItem('ef_custom_members', JSON.stringify([created, ...existing]));
    } catch (e) {}

    // Record UTR payment in queue if UPI was used
    if (isUpi && newMember.utr_number.trim()) {
      const utrReq = {
        id: 'utr_' + Date.now(),
        member_name: created.full_name,
        reg_id: regId,
        plan: created.plan_name,
        amount: amountNum,
        utr_number: newMember.utr_number.trim(),
        proof_note: newMember.proof_note.trim() || 'Paid via UPI QR at registration',
        submitted_at: new Date().toISOString(),
        status: isVerified ? 'VERIFIED' : 'PENDING'
      };

      try {
        const storedUtrs = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
        localStorage.setItem('ef_submitted_utr_requests', JSON.stringify([utrReq, ...storedUtrs]));
      } catch (e) {}

      // Try sending to backend payment-requests
      try {
        await api.post('/payment-requests', {
          plan_id: 1,
          utr_number: newMember.utr_number.trim(),
          proof_note: newMember.proof_note.trim() || 'UPI QR Registration'
        });
      } catch (err) {}
    }

    // Persist member record to backend database
    try {
      const planIdMap = { 1: 1, 3: 2, 6: 3, 12: 4 };
      const planId = planIdMap[newMember.duration_months] || 2;
      const res = await api.post('/members', {
        full_name: created.full_name,
        phone: created.phone,
        email: created.email || undefined,
        plan_id: planId,
        payment_method: newMember.payment_method,
        status: isVerified ? 'ACTIVE' : 'INACTIVE',
        amount: amountNum,
        utr_number: newMember.utr_number.trim() || undefined
      });
      if (res.data?.success && res.data.data) {
        created.id = String(res.data.data.id || created.id);
        created.registration_id = res.data.data.registration_id || created.registration_id;
      }
    } catch (err) {
      console.log('Backend member create note:', err.message);
    }

    setShowAddModal(false);
    showToast(
      isVerified
        ? `✅ Member ${created.full_name} registered & activated!`
        : `📋 Member ${created.full_name} registered! UTR #${newMember.utr_number} queued in Finance for owner verification.`
    );

    // Reset form
    setNewMember({
      full_name: '', phone: '', email: '',
      plan_name: 'Quarterly Beast Mode', duration_months: 3, amount_paid: '₹2,699',
      payment_method: 'UPI', utr_number: '', proof_note: '', instant_verify: true
    });
  };

  const getInitials = (name) => {
    const safeName = (name || 'EF').trim() || 'EF';
    return safeName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'EF';
  };

  const filteredMembers = members.filter((m) => {
    if (!m || !m.id) return false;
    const name = (m.full_name || '').toLowerCase();
    const regId = (m.registration_id || '').toLowerCase();
    const phone = (m.phone || '');
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      regId.includes(search.toLowerCase()) ||
      phone.includes(search);
    const matchesStatus = filterStatus === 'ALL' || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate current payment QR URL for display
  const planAmountNum = parseInt(newMember.amount_paid.replace(/[^0-9]/g, '')) || 2699;
  const effectiveQrCode = paymentQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=elitefitness@upi&pn=Elite%20Fitness&am=${planAmountNum}&cu=INR`)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#FFFFFF',
          border: '1.5px solid #DCEBFA',
          color: '#1F2937',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(77, 166, 255, 0.18)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          maxWidth: '90vw',
        }}>
          <Sparkles size={16} color="#4DA6FF" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#EAF5FF',
              border: '1px solid #DCEBFA',
              borderRadius: '10px',
              padding: '7px 14px',
              cursor: 'pointer',
              color: '#4DA6FF',
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              width: 'fit-content',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F2937' }}>Member Management</h2>
            <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>
              Full member profiles with instant one-tap status overrides & live sync.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={loadMembers}
              disabled={refreshing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Syncing...' : 'Sync Members'}
            </button>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <UserPlus size={18} /> Add New Member
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar — no filter chips */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by member name, Reg ID, or phone..."
            style={{ paddingLeft: '42px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Member Cards Grid — Exactly matching User's Second Image */}
      <div className="member-square-grid">
        {filteredMembers.map((m) => {
          const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.ACTIVE;
          const payCfg = PAYMENT_CONFIG[m.payment_status] || PAYMENT_CONFIG.PAID;

          return (
            <div
              key={m.id}
              className="glass-card"
              style={{
                background: '#FFFFFF',
                border: '1px solid #DCEBFA',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 2px 8px rgba(77, 166, 255, 0.08)',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
            >
              {/* Profile Header: Square Avatar, Name, Reg ID, ACTIVE Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: '#EAF5FF',
                padding: '12px 14px',
                borderRadius: '14px'
              }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #4DA6FF, #2E8FE8)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  fontFamily: 'Outfit, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(77, 166, 255, 0.35)'
                }}>
                  {getInitials(m.full_name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#1F2937',
                    margin: 0,
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {m.full_name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap', position: 'relative' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      color: '#4DA6FF',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      {m.registration_id}
                    </span>
                    {/* Clickable status badge — opens dropdown */}
                    <button
                      type="button"
                      onClick={() => setOpenStatusId(openStatusId === m.id ? null : m.id)}
                      style={{
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    >
                      {m.status} ▾
                    </button>

                    {/* Status dropdown popover */}
                    {openStatusId === m.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 200,
                        marginTop: '6px',
                        background: '#FFFFFF',
                        border: '1.5px solid #DCEBFA',
                        borderRadius: '14px',
                        padding: '8px',
                        display: 'flex',
                        gap: '6px',
                        boxShadow: '0 8px 24px rgba(77, 166, 255, 0.15)',
                        animation: 'fadeIn 0.15s ease'
                      }}>
                        {[
                          { st: 'ACTIVE', icon: CheckCircle, color: '#10B981' },
                          { st: 'FROZEN', icon: Snowflake, color: '#38BDF8' },
                          { st: 'EXPIRED', icon: AlertCircle, color: '#EF4444' },
                          { st: 'INACTIVE', icon: XCircle, color: '#9CA3AF' }
                        ].map(({ st, icon: Icon, color }) => {
                          const isCurr = m.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => { handleUpdateStatus(m.id, st); setOpenStatusId(null); }}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '10px',
                                border: isCurr ? `2px solid ${color}` : '1px solid #DCEBFA',
                                background: isCurr ? `${color}22` : '#F8FBFF',
                                color: isCurr ? color : '#6B7280',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                transition: 'all 0.15s ease',
                                minWidth: '56px',
                                fontFamily: 'Outfit, sans-serif'
                              }}
                            >
                              <Icon size={15} color={isCurr ? color : '#9CA3AF'} />
                              <span>{st}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>


              {/* Phone & Email Boxes (Side by Side) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{
                  background: '#F0F7FF',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #DCEBFA'
                }}>
                  <span style={{ color: '#6B7280', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                    PHONE NUMBER
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1F2937', marginTop: '3px' }}>
                    {m.phone}
                  </div>
                </div>

                <div style={{
                  background: '#F0F7FF',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #DCEBFA'
                }}>
                  <span style={{ color: '#6B7280', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                    EMAIL ADDRESS
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1F2937', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.email || 'None provided'}
                  </div>
                </div>
              </div>

              {/* Plan & Payment Details Box */}
              <div style={{
                background: '#F0F7FF',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1px solid #DCEBFA',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Assigned Plan:</span>
                  <strong style={{ color: '#1F2937', fontSize: '0.95rem' }}>{m.plan_name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Expiry Date:</span>
                  <strong style={{ color: '#4DA6FF', fontSize: '1rem', fontFamily: 'monospace' }}>{m.end_date}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Payment Standing:</span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    background: payCfg.bg,
                    color: payCfg.color,
                    border: `1px solid ${payCfg.color}40`
                  }}>
                    {m.payment_status} ({m.amount_paid})
                  </span>
                </div>
              </div>

              {/* Quick Cash Collection Action when Payment is Due or Inactive */}
              {(m.status === 'INACTIVE' || m.payment_status === 'DUE' || m.payment_status === 'PENDING') && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const updated = members.map(item =>
                      item.id === m.id
                        ? { ...item, status: 'ACTIVE', payment_status: 'PAID' }
                        : item
                    );
                    setMembers(updated);
                    try {
                      localStorage.setItem('ef_custom_members', JSON.stringify(updated));

                      // Update UTR & Cash requests list
                      const storedUtrs = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
                      const updatedUtrs = storedUtrs.map(u =>
                        (u.reg_id === m.registration_id || u.member_name === m.full_name)
                          ? { ...u, status: 'VERIFIED' }
                          : u
                      );
                      localStorage.setItem('ef_submitted_utr_requests', JSON.stringify(updatedUtrs));

                      // Broadcast live instant pass unlock event for customer registration portal
                      localStorage.setItem('ef_payment_verified_event', JSON.stringify({
                        reg_id: m.registration_id,
                        member_name: m.full_name,
                        timestamp: Date.now()
                      }));
                    } catch (_) {}

                    // Attempt background sync with backend payment-requests API
                    api.get('/payment-requests?status=PENDING,PENDING_CASH').then(res => {
                      const list = res.data?.data || [];
                      const match = list.find(r => r.registration_id === m.registration_id || String(r.member_id) === String(m.id));
                      if (match) {
                        api.post(`/payment-requests/${match.id}/verify`).catch(() => {});
                      }
                    }).catch(() => {});

                    showToast(`✅ Cash collected! ${m.full_name}'s digital pass is now ACTIVE.`);
                  }}
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle size={16} /> Collect Cash & Activate Pass
                </button>
              )}

              {/* Direct Touch Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`https://wa.me/91${m.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${m.full_name}, greetings from Elite Fitness!`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: '9px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    justifyContent: 'center',
                    textDecoration: 'none',
                    color: '#10B981',
                    borderColor: 'rgba(16, 185, 129, 0.3)'
                  }}
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`tel:${m.phone}`}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: '9px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    justifyContent: 'center',
                    textDecoration: 'none',
                    color: '#38BDF8',
                    borderColor: 'rgba(56, 189, 248, 0.3)'
                  }}
                >
                  📞 Call
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No members match your criteria.</p>
          <p style={{ fontSize: '0.85rem' }}>Try clearing the search query or changing the status filter.</p>
        </div>
      )}

      {/* Add New Member Modal with Owner's Payment QR & UTR input */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content animate-fade-in"
            style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={22} color="#F59E0B" />
                <h3 style={{ fontSize: '1.3rem', color: '#F9FAFB', fontWeight: 800 }}>Register New Gym Member</h3>
              </div>
              <X size={20} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Member Details */}
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Rahul Sharma"
                  value={newMember.full_name}
                  onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="e.g. 9876543210"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. rahul@example.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="label">Select Membership Plan</label>
                <select
                  className="input-field"
                  value={newMember.plan_name}
                  onChange={(e) => {
                    const val = e.target.value;
                    let dur = 3;
                    let amt = '₹2,699';
                    if (val === 'Monthly Pass') { dur = 1; amt = '₹999'; }
                    else if (val === 'Quarterly Beast Mode') { dur = 3; amt = '₹2,699'; }
                    else if (val === 'Half-Yearly Elite Pass') { dur = 6; amt = '₹4,999'; }
                    else if (val === 'Annual Champion Membership') { dur = 12; amt = '₹8,999'; }
                    setNewMember({ ...newMember, plan_name: val, duration_months: dur, amount_paid: amt });
                  }}
                >
                  <option value="Monthly Pass">Monthly Transformation Pass (1 Mo - ₹999)</option>
                  <option value="Quarterly Beast Mode">Quarterly Beast Mode (3 Mo - ₹2,699)</option>
                  <option value="Half-Yearly Elite Pass">Half-Yearly Elite Pass (6 Mo - ₹4,999)</option>
                  <option value="Annual Champion Membership">Annual Champion Membership (12 Mo - ₹8,999)</option>
                </select>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewMember({ ...newMember, payment_method: 'UPI' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: newMember.payment_method === 'UPI' ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: newMember.payment_method === 'UPI' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: newMember.payment_method === 'UPI' ? '#F59E0B' : '#9CA3AF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <QrCode size={18} /> UPI QR Transfer
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMember({ ...newMember, payment_method: 'CASH' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: newMember.payment_method === 'CASH' ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: newMember.payment_method === 'CASH' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: newMember.payment_method === 'CASH' ? '#F59E0B' : '#9CA3AF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <CreditCard size={18} /> Cash at Reception
                  </button>
                </div>
              </div>

              {/* UPI QR Code Display & UTR Submission Box */}
              {newMember.payment_method === 'UPI' && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {paymentQrLabel || 'Gym Payment QR'}
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                      Pay {newMember.amount_paid}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>
                      Scan using Google Pay, PhonePe, Paytm or BHIM UPI
                    </div>
                  </div>

                  {/* QR Image */}
                  <div style={{
                    padding: '10px',
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={effectiveQrCode}
                      alt="Gym Payment QR"
                      style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block' }}
                    />
                  </div>

                  {/* UTR Input Field */}
                  <div style={{ width: '100%' }}>
                    <label className="label" style={{ color: '#F59E0B' }}>
                      Enter 12-Digit UTR Number / Transaction ID *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 326194857201"
                      value={newMember.utr_number}
                      onChange={(e) => setNewMember({ ...newMember, utr_number: e.target.value })}
                      required={newMember.payment_method === 'UPI'}
                      style={{
                        borderColor: newMember.utr_number ? '#10B981' : 'rgba(245, 158, 11, 0.4)',
                        letterSpacing: '0.05em',
                        fontFamily: 'monospace',
                        fontWeight: 700
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                      Once payment is sent, enter the UTR / Ref reference number from the UPI app receipt.
                    </span>
                  </div>

                  {/* Payment Note */}
                  <div style={{ width: '100%' }}>
                    <label className="label">Payment Note / App Used (Optional)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Paid via PhonePe / GPay"
                      value={newMember.proof_note}
                      onChange={(e) => setNewMember({ ...newMember, proof_note: e.target.value })}
                    />
                  </div>

                  {/* Instant Verification vs Send to Finance Queue */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '10px 14px',
                    borderRadius: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F9FAFB' }}>Verify & Activate Immediately</div>
                      <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>If unticked, UTR will be queued in Finance for verification</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newMember.instant_verify}
                      onChange={(e) => setNewMember({ ...newMember, instant_verify: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>
                  <Check size={18} /> Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
