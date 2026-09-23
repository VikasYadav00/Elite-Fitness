import React, { useEffect, useState } from 'react';
import {
  Users, DollarSign, Clock, AlertTriangle, TrendingUp,
  UserPlus, ArrowUpRight, X, Phone, Mail, Calendar,
  Award, CheckCircle, Snowflake, XCircle, AlertCircle,
  ChevronRight, QrCode, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import api from '../api';

// ── Mock Data ────────────────────────────────────────────────────────────────

const REVENUE_DATA = [
  { day: 'Mon', amount: 12500 },
  { day: 'Tue', amount: 18000 },
  { day: 'Wed', amount: 14200 },
  { day: 'Thu', amount: 22500 },
  { day: 'Fri', amount: 31000 },
  { day: 'Sat', amount: 45000 },
  { day: 'Sun', amount: 28000 },
];

// Last 6 months attendance data
const ATTENDANCE_6M = [
  { month: 'Apr', present: 420, absent: 180 },
  { month: 'May', present: 510, absent: 140 },
  { month: 'Jun', present: 475, absent: 165 },
  { month: 'Jul', present: 580, absent: 120 },
  { month: 'Aug', present: 620, absent: 110 },
  { month: 'Sep', present: 540, absent: 130 },
];

const ACTIVE_MEMBERS = [
  { id: '1', registration_id: 'EF26091001', full_name: 'Rahul Sharma', phone: '9876543210', plan_name: 'Quarterly Beast Mode', end_date: '2026-12-15', status: 'ACTIVE', payment_status: 'PAID' },
  { id: '2', registration_id: 'EF26091002', full_name: 'Priya Verma', phone: '9812345678', plan_name: 'Monthly Pass', end_date: '2026-10-18', status: 'ACTIVE', payment_status: 'PAID' },
  { id: '5', registration_id: 'EF26091005', full_name: 'Vikram Singh', phone: '9123456789', plan_name: 'Half-Yearly Elite', end_date: '2027-02-10', status: 'ACTIVE', payment_status: 'PAID' },
  { id: '6', registration_id: 'EF26091006', full_name: 'Ananya Deshmukh', phone: '9845123456', plan_name: 'Annual Champion', end_date: '2027-08-30', status: 'ACTIVE', payment_status: 'PAID' },
  { id: '7', registration_id: 'EF26091007', full_name: 'Karthik Iyer', phone: '9765098765', plan_name: 'Quarterly Beast Mode', end_date: '2026-11-05', status: 'ACTIVE', payment_status: 'PAID' },
  { id: '8', registration_id: 'EF26091008', full_name: 'Meena Joshi', phone: '9654321098', plan_name: 'Annual Champion', end_date: '2027-06-12', status: 'ACTIVE', payment_status: 'PAID' },
];

const TODAY_ATTENDANCE = [
  { id: 'a1', reg_id: 'EF26091001', name: 'Rahul Sharma', phone: '9876543210', checkin_time: '06:15 AM', method: 'QR' },
  { id: 'a2', reg_id: 'EF26091002', name: 'Priya Verma', phone: '9812345678', checkin_time: '07:30 AM', method: 'QR' },
  { id: 'a3', reg_id: 'EF26091005', name: 'Vikram Singh', phone: '9123456789', checkin_time: '08:10 AM', method: 'MANUAL' },
  { id: 'a4', reg_id: 'EF26091006', name: 'Ananya Deshmukh', phone: '9845123456', checkin_time: '09:05 AM', method: 'QR' },
  { id: 'a5', reg_id: 'EF26091008', name: 'Meena Joshi', phone: '9654321098', checkin_time: '09:45 AM', method: 'QR' },
  { id: 'a6', reg_id: 'EF26091007', name: 'Karthik Iyer', phone: '9765098765', checkin_time: '10:20 AM', method: 'QR' },
];

const EXPIRING_MEMBERS = [
  { id: '3', registration_id: 'EF26091003', full_name: 'Amit Patel', phone: '9765432109', plan_name: 'Monthly Pass', end_date: '2026-09-24', days_left: 3, status: 'ACTIVE' },
  { id: '9', registration_id: 'EF26091009', full_name: 'Suresh Nair', phone: '9843210987', plan_name: 'Quarterly Beast Mode', end_date: '2026-09-25', days_left: 4, status: 'ACTIVE' },
  { id: '10', registration_id: 'EF26091010', full_name: 'Deepa Reddy', phone: '9712345678', plan_name: 'Monthly Pass', end_date: '2026-09-26', days_left: 5, status: 'ACTIVE' },
  { id: '11', registration_id: 'EF26091011', full_name: 'Rajesh Kumar', phone: '9876501234', plan_name: 'Half-Yearly Elite', end_date: '2026-09-27', days_left: 6, status: 'ACTIVE' },
  { id: '12', registration_id: 'EF26091012', full_name: 'Nisha Singh', phone: '9634512345', plan_name: 'Monthly Pass', end_date: '2026-09-28', days_left: 7, status: 'ACTIVE' },
];

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  ACTIVE: { color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', icon: CheckCircle },
  FROZEN: { color: '#38BDF8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.3)', icon: Snowflake },
  EXPIRED: { color: '#F87171', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', icon: AlertCircle },
  INACTIVE: { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.3)', icon: XCircle },
};

// ── Drawer Component ──────────────────────────────────────────────────────────
function Drawer({ title, subtitle, color, children, onClose }) {
  return (
    <>
      {/* Backdrop — sits above headers and navigation bars (zIndex 2500) */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 2500,
          animation: 'fadeIn 0.2s ease'
        }}
      />
      {/* Panel — zIndex 2501 sits on top of all fixed headers/bottom-navs */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(560px, 100vw)',
        background: 'linear-gradient(180deg, #0F172A 0%, #0B0F17 100%)',
        borderLeft: `2px solid ${color || 'rgba(245,158,11,0.5)'}`,
        zIndex: 2501,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.85)',
        animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)'
      }}>
        {/* Drawer Header — sticky, safe-area aware, with clear Back button */}
        <div style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
          paddingBottom: '14px',
          paddingLeft: '16px',
          paddingRight: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: '#0F172A',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.15))',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '10px',
              padding: '8px 16px',
              cursor: 'pointer',
              color: '#F59E0B',
              fontSize: '0.85rem', fontWeight: 700,
              fontFamily: 'Outfit, sans-serif',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1, textAlign: 'center', paddingInline: '8px', minWidth: 0 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F9FAFB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            {subtitle && <div style={{ color: '#9CA3AF', fontSize: '0.72rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              color: '#9CA3AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 80px 20px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}

// ── Member Row Card ───────────────────────────────────────────────────────────
function MemberRow({ m }) {
  const cfg = STATUS_CFG[m.status] || STATUS_CFG.ACTIVE;
  const initials = m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      marginBottom: '8px'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
        background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(217,119,6,0.1))',
        border: '1px solid rgba(245,158,11,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: '#F59E0B', fontSize: '0.9rem', fontFamily: 'Outfit,sans-serif'
      }}>{initials}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F9FAFB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.full_name}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>
          <span style={{ fontFamily: 'monospace', color: '#F59E0B' }}>{m.registration_id}</span>
          {' · '}{m.phone}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#D1D5DB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
          {m.plan_name}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>
          Exp: <span style={{ color: '#10B981' }}>{m.end_date}</span>
        </div>
      </div>
    </div>
  );
}

// ── Attendance Row ────────────────────────────────────────────────────────────
function AttendanceRow({ a }) {
  const initials = a.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      marginBottom: '8px'
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
        background: 'rgba(56,189,248,0.12)',
        border: '1px solid rgba(56,189,248,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: '#38BDF8', fontSize: '0.85rem', fontFamily: 'Outfit,sans-serif'
      }}>{initials}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F9FAFB' }}>{a.name}</div>
        <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px', fontFamily: 'monospace' }}>
          {a.reg_id}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: '#10B981', fontSize: '0.85rem' }}>{a.checkin_time}</div>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700, marginTop: '3px',
          padding: '1px 7px', borderRadius: '999px', display: 'inline-block',
          background: a.method === 'QR' ? 'rgba(56,189,248,0.12)' : 'rgba(245,158,11,0.12)',
          color: a.method === 'QR' ? '#38BDF8' : '#F59E0B'
        }}>
          {a.method === 'QR' ? '🔵 QR' : '✏️ Manual'}
        </div>
      </div>
    </div>
  );
}

// ── Expiring Row ──────────────────────────────────────────────────────────────
function ExpiringRow({ m }) {
  const initials = m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const urgency = m.days_left <= 3 ? '#EF4444' : m.days_left <= 5 ? '#F59E0B' : '#FB923C';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${m.days_left <= 3 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.15)'}`,
      borderRadius: '12px',
      marginBottom: '8px'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
        background: `rgba(239,68,68,0.12)`,
        border: `1px solid rgba(239,68,68,0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: '#F87171', fontSize: '0.9rem', fontFamily: 'Outfit,sans-serif'
      }}>{initials}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F9FAFB' }}>{m.full_name}</div>
        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>
          <span style={{ fontFamily: 'monospace', color: '#F59E0B' }}>{m.registration_id}</span>
          {' · '}{m.plan_name}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontWeight: 900, fontSize: '1rem', color: urgency
        }}>
          {m.days_left}d left
        </div>
        <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>{m.end_date}</div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardView({ setActiveTab }) {
  const [stats, setStats] = useState({
    activeMembers: ACTIVE_MEMBERS.length,
    todayAttendance: TODAY_ATTENDANCE.length,
    monthlyRevenue: 178500,
    expiringMemberships: EXPIRING_MEMBERS.length,
  });

  const [activeMembers, setActiveMembers] = useState(ACTIVE_MEMBERS);
  const [todayAttendance, setTodayAttendance] = useState(TODAY_ATTENDANCE);
  const [expiringMembers, setExpiringMembers] = useState(EXPIRING_MEMBERS);
  const [attendance6m, setAttendance6m] = useState(ATTENDANCE_6M);

  // Drawer state: null | 'active' | 'attendance' | 'expiring'
  const [drawerType, setDrawerType] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data?.data) {
          setStats(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        // Use mock data
      }
    }

    async function fetchActiveMembers() {
      try {
        const res = await api.get('/members?status=ACTIVE&limit=50');
        if (res.data?.data?.members?.length > 0) {
          setActiveMembers(res.data.data.members.map(m => ({
            id: String(m.id),
            registration_id: m.registration_id || `EF2609${m.id}`,
            full_name: m.full_name || 'Member',
            phone: m.phone || '',
            plan_name: m.plan_name || 'N/A',
            end_date: m.end_date ? m.end_date.split('T')[0] : 'N/A',
            status: m.status || 'ACTIVE',
            payment_status: m.payment_status || 'PAID',
          })));
        }
      } catch (_) {}
    }

    async function fetchTodayAttendance() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await api.get(`/attendance?date=${today}&limit=100`);
        if (res.data?.data?.length > 0) {
          setTodayAttendance(res.data.data.map(a => ({
            id: String(a.id),
            reg_id: a.registration_id || a.reg_id || 'N/A',
            name: a.full_name || a.name || 'Member',
            phone: a.phone || '',
            checkin_time: a.check_in_time || a.checkin_time || '—',
            method: a.method || 'QR',
          })));
        }
      } catch (_) {}
    }

    async function fetchAttendance6M() {
      try {
        const res = await api.get('/reports/attendance-summary?months=6');
        if (res.data?.data?.length > 0) {
          setAttendance6m(res.data.data);
        }
      } catch (_) {}
    }

    fetchStats();
    fetchActiveMembers();
    fetchTodayAttendance();
    fetchAttendance6M();
  }, []);

  const drawerConfig = {
    active: {
      title: `Active Members (${activeMembers.length})`,
      subtitle: 'All currently active gym members',
      color: 'rgba(245,158,11,0.5)',
      content: (
        <>
          {activeMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>No active members found.</div>
          ) : (
            activeMembers.map(m => <MemberRow key={m.id} m={m} />)
          )}
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => { setDrawerType(null); setActiveTab('members'); }}
          >
            View Full Members Section <ChevronRight size={16} />
          </button>
          <button
            className="btn-secondary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => setDrawerType(null)}
          >
            ← Back to Dashboard
          </button>
        </>
      )
    },
    attendance: {
      title: `Today's Attendance (${todayAttendance.length})`,
      subtitle: `Members present on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      color: 'rgba(56,189,248,0.5)',
      content: (
        <>
          {todayAttendance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>No check-ins recorded today yet.</div>
          ) : (
            todayAttendance.map(a => <AttendanceRow key={a.id} a={a} />)
          )}
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px', background: 'linear-gradient(135deg,#38BDF8,#0EA5E9)' }}
            onClick={() => { setDrawerType(null); setActiveTab('attendance'); }}
          >
            <QrCode size={16} /> Open Attendance & QR Panel
          </button>
          <button
            className="btn-secondary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => setDrawerType(null)}
          >
            ← Back to Dashboard
          </button>
        </>
      )
    },
    expiring: {
      title: `Memberships Expiring Soon (${expiringMembers.length})`,
      subtitle: 'Members whose membership expires within 7 days',
      color: 'rgba(239,68,68,0.5)',
      content: (
        <>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px',
            marginBottom: '14px',
            fontSize: '0.8rem',
            color: '#FCA5A5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              These members haven't renewed yet. Consider sending a broadcast reminder or calling them directly.
            </span>
          </div>

          {expiringMembers.map(m => <ExpiringRow key={m.id} m={m} />)}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => { setDrawerType(null); setActiveTab('broadcast'); }}
            >
              📢 Send Renewal Broadcast
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={() => { setDrawerType(null); setActiveTab('members'); }}
            >
              View All Members
            </button>
          </div>
          <button
            className="btn-secondary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => setDrawerType(null)}
          >
            ← Back to Dashboard
          </button>
        </>
      )
    }
  };

  const currentDrawer = drawerType ? drawerConfig[drawerType] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Welcome Banner */}
      <div className="glass-card" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(17,24,39,0.9) 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
            Welcome back, <span style={{ color: '#F59E0B' }}>Gym Owner</span> 👋
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
            Here is what's happening at Elite Fitness today — click any card to see the full list.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('members')}>
          <UserPlus size={18} /> Register New Member
        </button>
      </div>

      {/* KPI Cards — 2×2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>

        {/* Active Members */}
        <div
          className="glass-card"
          onClick={() => setDrawerType('active')}
          style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="label">Active Members</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F9FAFB' }}>{stats.activeMembers}</div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <TrendingUp size={14} /> +12% from last month
          </div>
          <div style={{ fontSize: '0.72rem', color: '#F59E0B', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            Click to see full list <ChevronRight size={12} />
          </div>
        </div>

        {/* Today Attendance */}
        <div
          className="glass-card"
          onClick={() => setDrawerType('attendance')}
          style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="label">Today's Attendance</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56,189,248,0.15)', color: '#38BDF8' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F9FAFB' }}>{stats.todayAttendance}</div>
          <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '6px' }}>Active Workout Session</div>
          <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            Click to see who's present <ChevronRight size={12} />
          </div>
        </div>

        {/* Revenue */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="label">Monthly Revenue</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>
            ₹{stats.monthlyRevenue?.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <TrendingUp size={14} /> ₹32,000 this week
          </div>
        </div>

        {/* Expiring */}
        <div
          className="glass-card"
          onClick={() => setDrawerType('expiring')}
          style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="label">Expiring (7 Days)</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', color: '#EF4444', position: 'relative' }}>
              <AlertTriangle size={20} />
              {stats.expiringMemberships > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  background: '#EF4444', color: '#fff',
                  borderRadius: '999px', width: '18px', height: '18px',
                  fontSize: '0.68rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{stats.expiringMemberships}</span>
              )}
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F87171' }}>
            {stats.expiringMemberships}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#F87171', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            Click to see who's expiring <ChevronRight size={12} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>

        {/* Revenue Area Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', color: '#F9FAFB' }}>
            💰 Weekly Revenue Trend
          </h3>
          <div style={{ height: '230px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid #F59E0B', borderRadius: '8px', fontSize: '0.8rem' }}
                  formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6-Month Attendance Bar Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', color: '#F9FAFB' }}>
            📊 Attendance — Last 6 Months
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '16px' }}>
            Monthly member check-in overview (all-time records)
          </p>
          <div style={{ height: '230px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendance6m} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#9CA3AF', paddingTop: '6px' }} />
                <Bar dataKey="present" name="Present" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="rgba(239,68,68,0.5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F9FAFB', marginBottom: '14px' }}>
          📅 Attendance Summary — Last 6 Months
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {attendance6m.map(m => {
            const total = m.present + m.absent;
            const pct = total > 0 ? Math.round((m.present / total) * 100) : 0;
            return (
              <div key={m.month} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '12px 14px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F59E0B', marginBottom: '6px' }}>{m.month}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>{m.present}</div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px' }}>check-ins</div>
                {/* Mini progress bar */}
                <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444',
                    borderRadius: '999px',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '4px' }}>{pct}% attendance rate</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-in Drawer */}
      {currentDrawer && (
        <Drawer
          title={currentDrawer.title}
          subtitle={currentDrawer.subtitle}
          color={currentDrawer.color}
          onClose={() => setDrawerType(null)}
        >
          {currentDrawer.content}
        </Drawer>
      )}
    </div>
  );
}
