import React, { useEffect, useState, useRef } from 'react';
import {
  Users, DollarSign, Clock, AlertTriangle, TrendingUp, TrendingDown,
  UserPlus, ArrowUpRight, X, Phone, Mail, Calendar,
  Award, CheckCircle, Snowflake, XCircle, AlertCircle,
  ChevronRight, ChevronLeft, QrCode, Sparkles, Quote, RefreshCw,
  Activity, ArrowRight, ShieldCheck, IndianRupee
} from 'lucide-react';
import api from '../api';

// ── Motivational Quotes Rotation Pool ─────────────────────────────────────────
const MOTIVATIONAL_QUOTES = [
  {
    id: 1,
    quote: "Discipline today creates strength tomorrow.",
    author: "Elite Fitness Focus",
    category: "Discipline"
  },
  {
    id: 2,
    quote: "Your only limit is the one you set yourself.",
    author: "Mindset & Growth",
    category: "Mindset"
  },
  {
    id: 3,
    quote: "Small progress every day becomes big results.",
    author: "Consistency Over Perfection",
    category: "Consistency"
  },
  {
    id: 4,
    quote: "Train hard. Stay consistent. Become stronger.",
    author: "Daily Athlete Principle",
    category: "Strength"
  },
  {
    id: 5,
    quote: "Success starts with self-discipline and perseverance.",
    author: "Core Fitness Philosophy",
    category: "Dedication"
  },
  {
    id: 6,
    quote: "The body achieves what the mind believes.",
    author: "Peak Performance Wisdom",
    category: "Focus"
  },
  {
    id: 7,
    quote: "Action is the foundational key to all success in fitness.",
    author: "Execution & Drive",
    category: "Action"
  },
  {
    id: 8,
    quote: "Wake up with determination. Go to bed with satisfaction.",
    author: "Daily Energy & Habit",
    category: "Motivation"
  },
];

// ── Status Configurations (Light Theme Friendly) ──────────────────────────────
const STATUS_CFG = {
  ACTIVE: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle, label: 'Active' },
  FROZEN: { color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', icon: Snowflake, label: 'Frozen' },
  EXPIRED: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: AlertCircle, label: 'Expired' },
  INACTIVE: { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', icon: XCircle, label: 'Inactive' },
};

// ── Motivational Quotes Horizontal Carousel ────────────────────────────────────
function MotivationalQuotesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = MOTIVATIONAL_QUOTES.length;

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 4800);

    return () => clearInterval(timer);
  }, [isPaused, total]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleDotClick = (index, e) => {
    if (e) e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      tabIndex={0}
      aria-label="Motivational Fitness Quotes Carousel"
    >
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: '#EFF6FF', color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={15} />
          </div>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            color: '#475569',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Motivation & Fitness Inspiration
          </span>
          {isPaused && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              background: '#F1F5F9',
              color: '#64748B',
              padding: '2px 7px',
              borderRadius: '999px'
            }}>
              Paused
            </span>
          )}
        </div>

        {/* Carousel Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handlePrev}
            aria-label="Previous quote"
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              transition: 'background-color 0.15s ease'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next quote"
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              transition: 'background-color 0.15s ease'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Viewport */}
      <div style={{ overflow: 'hidden', position: 'relative', minHeight: '64px', display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          {MOTIVATIONAL_QUOTES.map((item) => (
            <div
              key={item.id}
              style={{
                flex: '0 0 100%',
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: '2px'
              }}>
                <Quote size={18} color="#2563EB" style={{ transform: 'rotate(180deg)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '1.08rem',
                  fontWeight: 700,
                  lineHeight: 1.45,
                  color: '#0F172A',
                  fontFamily: 'Outfit, sans-serif',
                  margin: 0
                }}>
                  “{item.quote}”
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '6px'
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2563EB' }}>
                    — {item.author}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    color: '#64748B',
                    background: '#F1F5F9',
                    padding: '1px 8px',
                    borderRadius: '999px',
                    fontWeight: 600
                  }}>
                    {item.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicator Dots Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '16px',
        paddingTop: '10px',
        borderTop: '1px solid #F1F5F9'
      }}>
        {MOTIVATIONAL_QUOTES.map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              onClick={(e) => handleDotClick(idx, e)}
              aria-label={`Go to quote ${idx + 1}`}
              style={{
                border: 'none',
                background: isActive ? '#2563EB' : '#CBD5E1',
                width: isActive ? '22px' : '6px',
                height: '6px',
                borderRadius: '999px',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.28s ease'
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Light-Themed Drawer Component ─────────────────────────────────────────────
function Drawer({ title, subtitle, color, children, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 2500,
          animation: 'fadeIn 0.2s ease'
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(560px, 100vw)',
        background: '#FFFFFF',
        borderLeft: `2px solid ${color || '#E2E8F0'}`,
        zIndex: 2501,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.12)',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
          paddingBottom: '14px',
          paddingLeft: '18px',
          paddingRight: '18px',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              padding: '8px 14px',
              cursor: 'pointer',
              color: '#2563EB',
              fontSize: '0.85rem', fontWeight: 700,
              fontFamily: 'Outfit, sans-serif',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'background-color 0.2s ease'
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ color: '#64748B', fontSize: '0.74rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 80px 18px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}

// ── Light-Theme Member Row Card ───────────────────────────────────────────────
function MemberRow({ m }) {
  const cfg = STATUS_CFG[m.status] || STATUS_CFG.ACTIVE;
  const initials = (m.full_name || 'Member').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '13px 15px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      marginBottom: '8px',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
        background: '#EFF6FF',
        border: '1px solid #DBEAFE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: '#2563EB', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif'
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.full_name}
        </div>
        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
          <span style={{ fontFamily: 'monospace', color: '#2563EB', fontWeight: 600 }}>{m.registration_id}</span>
          {m.phone ? ` · ${m.phone}` : ''}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
          {m.plan_name}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
          Exp: <span style={{ color: '#059669', fontWeight: 600 }}>{m.end_date}</span>
        </div>
      </div>
    </div>
  );
}

// ── Light-Theme Attendance Row Card ───────────────────────────────────────────
function AttendanceRow({ a }) {
  const initials = (a.name || 'Member').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isQR = a.method === 'QR';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 15px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      marginBottom: '8px',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
        background: isQR ? '#EFF6FF' : '#FFFBEB',
        border: `1px solid ${isQR ? '#BFDBFE' : '#FDE68A'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: isQR ? '#2563EB' : '#D97706', fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif'
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{a.name}</div>
        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px', fontFamily: 'monospace' }}>
          {a.reg_id}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>{a.checkin_time}</div>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700, marginTop: '3px',
          padding: '2px 8px', borderRadius: '999px', display: 'inline-block',
          background: isQR ? '#EFF6FF' : '#FFFBEB',
          color: isQR ? '#2563EB' : '#D97706',
          border: `1px solid ${isQR ? '#DBEAFE' : '#FEF3C7'}`
        }}>
          {isQR ? '⚡ QR Scan' : '✏️ Manual'}
        </div>
      </div>
    </div>
  );
}

// ── Light-Theme Expiring Row Card ─────────────────────────────────────────────
function ExpiringRow({ m }) {
  const initials = (m.full_name || 'Member').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const days = m.days_left ?? 0;
  const isUrgent = days <= 3;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '13px 15px',
      background: isUrgent ? '#FFF1F2' : '#FFFBEB',
      border: `1px solid ${isUrgent ? '#FECDD3' : '#FDE68A'}`,
      borderRadius: '12px',
      marginBottom: '8px',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
        background: isUrgent ? '#FFE4E6' : '#FEF3C7',
        border: `1px solid ${isUrgent ? '#FDA4AF' : '#FCD34D'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: isUrgent ? '#E11D48' : '#D97706', fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif'
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{m.full_name}</div>
        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
          <span style={{ fontFamily: 'monospace', color: '#2563EB', fontWeight: 600 }}>{m.registration_id}</span>
          {' · '}{m.plan_name}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontWeight: 800, fontSize: '0.92rem',
          color: isUrgent ? '#E11D48' : '#D97706'
        }}>
          {days}d left
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
          {m.end_date}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function DashboardView({ setActiveTab }) {
  // Statistics State (100% Dynamic from Backend Database)
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    newRegistrations: 0,
    todayAttendance: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    todayProfit: 0,
    pendingPayments: 0,
    pendingMemberships: 0,
    renewalsThisMonth: 0,
    membershipsExpiringSoon: 0,
    expiringMemberships: 0
  });

  const [activeMembersList, setActiveMembersList] = useState([]);
  const [todayAttendanceList, setTodayAttendanceList] = useState([]);
  const [expiringMembersList, setExpiringMembersList] = useState([]);
  const [recentRegistrationsList, setRecentRegistrationsList] = useState([]);

  // Tab for Live Member Activity: 'registrations' | 'attendance' | 'expiring'
  const [activityTab, setActivityTab] = useState('registrations');

  // Drawer state: null | 'active' | 'attendance' | 'expiring' | 'pending'
  const [drawerType, setDrawerType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Data Fetching Function
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, attendanceRes, regRes, expiringRes, membersRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/attendance/today'),
        api.get('/dashboard/recent-registrations'),
        api.get('/dashboard/expiring-memberships'),
        api.get('/members?status=ACTIVE&limit=50')
      ]);

      // 1. Process Stats
      if (statsRes.status === 'fulfilled' && statsRes.value.data?.data) {
        const d = statsRes.value.data.data;
        setStats({
          totalMembers: d.totalMembers ?? 0,
          activeMembers: d.activeMembers ?? 0,
          expiredMembers: d.expiredMembers ?? 0,
          newRegistrations: d.newRegistrations ?? 0,
          todayAttendance: d.todayAttendance ?? 0,
          monthlyRevenue: d.monthlyRevenue ?? 0,
          monthlyExpenses: d.monthlyExpenses ?? 0,
          netProfit: d.netProfit ?? 0,
          todayRevenue: d.todayRevenue ?? 0,
          todayExpenses: d.todayExpenses ?? 0,
          todayProfit: d.todayProfit ?? 0,
          pendingPayments: d.pendingPayments ?? 0,
          pendingMemberships: d.pendingMemberships ?? 0,
          renewalsThisMonth: d.renewalsThisMonth ?? 0,
          membershipsExpiringSoon: d.membershipsExpiringSoon ?? d.expiringMemberships ?? 0,
          expiringMemberships: d.expiringMemberships ?? d.membershipsExpiringSoon ?? 0,
        });
      }

      // 2. Process Today's Attendance
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value.data?.data) {
        const payload = attendanceRes.value.data.data;
        const rows = payload.records || (Array.isArray(payload) ? payload : []);
        setTodayAttendanceList(rows.map((a) => ({
          id: String(a.id),
          reg_id: a.registration_id || a.reg_id || `EF-${a.member_id}`,
          name: a.full_name || a.name || 'Gym Member',
          phone: a.phone || '',
          checkin_time: a.check_in_time
            ? new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : (a.checkin_time || '—'),
          method: a.method || 'QR',
        })));
      }

      // 3. Process Recent Registrations
      if (regRes.status === 'fulfilled' && regRes.value.data?.data) {
        const rows = Array.isArray(regRes.value.data.data) ? regRes.value.data.data : [];
        setRecentRegistrationsList(rows.map((r, idx) => ({
          id: String(r.id || idx),
          registration_id: r.registration_id || `EF2609${idx}`,
          full_name: r.full_name || 'New Member',
          phone: r.phone || '',
          plan_name: r.plan_name || 'Standard Pass',
          joining_date: r.joining_date ? String(r.joining_date).split('T')[0] : 'Today',
          status: r.status || 'ACTIVE',
          payment_status: r.payment_status || 'PAID'
        })));
      }

      // 4. Process Expiring Memberships
      if (expiringRes.status === 'fulfilled' && expiringRes.value.data?.data) {
        const rows = Array.isArray(expiringRes.value.data.data) ? expiringRes.value.data.data : [];
        setExpiringMembersList(rows.map((m, idx) => ({
          id: String(m.id || idx),
          registration_id: m.registration_id || 'N/A',
          full_name: m.full_name || 'Member',
          phone: m.phone || '',
          plan_name: m.plan_name || 'Standard Pass',
          end_date: m.end_date ? String(m.end_date).split('T')[0] : 'N/A',
          days_left: Math.max(0, parseInt(m.days_remaining) || 0),
          status: 'ACTIVE'
        })));
      }

      // 5. Process Active Members List
      if (membersRes.status === 'fulfilled' && membersRes.value.data?.data) {
        const payload = membersRes.value.data.data;
        const rows = Array.isArray(payload) ? payload : (payload.members || []);
        setActiveMembersList(rows.map((m) => ({
          id: String(m.id),
          registration_id: m.registration_id || `EF2609${m.id}`,
          full_name: m.full_name || 'Member',
          phone: m.phone || '',
          plan_name: m.plan_name || 'Active Membership',
          end_date: m.end_date ? String(m.end_date).split('T')[0] : 'N/A',
          status: m.status || 'ACTIVE',
          payment_status: m.payment_status || 'PAID',
        })));
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Derived Attendance Metrics
  const activeCount = stats.activeMembers || 0;
  const presentCount = stats.todayAttendance || 0;
  const absentOrExpected = Math.max(0, activeCount - presentCount);
  const attendanceRate = activeCount > 0 ? Math.min(100, Math.round((presentCount / activeCount) * 100)) : 0;

  // Drawer Configuration
  const drawerConfig = {
    active: {
      title: `Active Members (${activeMembersList.length || stats.activeMembers})`,
      subtitle: 'All members with active gym access',
      color: '#059669',
      content: (
        <>
          {activeMembersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              No active members found in database.
            </div>
          ) : (
            activeMembersList.map((m) => <MemberRow key={m.id} m={m} />)
          )}
          <button
            onClick={() => { setDrawerType(null); setActiveTab('members'); }}
            style={{
              width: '100%', marginTop: '12px', padding: '12px',
              background: '#0F172A', color: '#FFFFFF',
              border: 'none', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            Manage All Members in Members Hub <ChevronRight size={16} />
          </button>
        </>
      )
    },
    attendance: {
      title: `Today's Attendance (${todayAttendanceList.length || stats.todayAttendance})`,
      subtitle: `Verified facility check-ins for today`,
      color: '#2563EB',
      content: (
        <>
          {todayAttendanceList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              No check-ins recorded today yet.
            </div>
          ) : (
            todayAttendanceList.map((a) => <AttendanceRow key={a.id} a={a} />)
          )}
          <button
            onClick={() => { setDrawerType(null); setActiveTab('attendance'); }}
            style={{
              width: '100%', marginTop: '12px', padding: '12px',
              background: '#2563EB', color: '#FFFFFF',
              border: 'none', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <QrCode size={16} /> Open Attendance & QR Scanner
          </button>
        </>
      )
    },
    expiring: {
      title: `Expiring Memberships (${expiringMembersList.length || stats.expiringMemberships})`,
      subtitle: 'Memberships expiring within 30 days',
      color: '#D97706',
      content: (
        <>
          <div style={{
            padding: '12px 14px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '10px',
            marginBottom: '14px',
            fontSize: '0.8rem',
            color: '#B45309',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              These members are approaching their membership end date. Send a renewal broadcast or call them directly.
            </span>
          </div>

          {expiringMembersList.map((m) => <ExpiringRow key={m.id} m={m} />)}

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              onClick={() => { setDrawerType(null); setActiveTab('broadcast'); }}
              style={{
                flex: 1, padding: '12px', background: '#FFFBEB', color: '#D97706',
                border: '1px solid #FDE68A', borderRadius: '10px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              📢 Send Reminder
            </button>
            <button
              onClick={() => { setDrawerType(null); setActiveTab('members'); }}
              style={{
                flex: 1, padding: '12px', background: '#2563EB', color: '#FFFFFF',
                border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              View Members Hub
            </button>
          </div>
        </>
      )
    },
    pending: {
      title: `Pending Memberships (${stats.pendingMemberships})`,
      subtitle: 'Registrations awaiting payment or activation',
      color: '#4F46E5',
      content: (
        <>
          <div style={{
            padding: '12px 14px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '10px',
            marginBottom: '14px',
            fontSize: '0.8rem',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertCircle size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              There are currently {stats.pendingMemberships} pending memberships or unpaid registration requests in the database.
            </span>
          </div>
          <button
            onClick={() => { setDrawerType(null); setActiveTab('payments'); }}
            style={{
              width: '100%', padding: '12px', background: '#2563EB', color: '#FFFFFF',
              border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Go to Finance & Payments Hub
          </button>
        </>
      )
    }
  };

  const currentDrawer = drawerType ? drawerConfig[drawerType] : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      color: '#0F172A',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* ── Executive Header Banner ─────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#2563EB',
              background: '#EFF6FF',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              Owner / Admin Portal
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              • {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#0F172A',
            margin: '4px 0 2px 0',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Elite Fitness Dashboard
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.84rem', margin: 0 }}>
            Real-time gym management overview • Synchronized directly with database
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={loadDashboardData}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            title="Refresh database metrics"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            style={{
              background: '#2563EB',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              transition: 'transform 0.15s ease'
            }}
          >
            <UserPlus size={16} />
            <span>New Member</span>
          </button>
        </div>
      </div>

      {/* ── Section 1: Motivational Quotes Carousel ──────────────────────────── */}
      <MotivationalQuotesCarousel />

      {/* ── Section 2: Today's Business Snapshot ──────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Today's Business Snapshot
            </h2>
            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
              Real-time daily financial and payment transactions
            </span>
          </div>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              background: 'none', border: 'none', color: '#2563EB',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '3px'
            }}
          >
            Finance Hub <ArrowRight size={13} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px'
        }}>
          {/* Today's Revenue */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Today's Revenue
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#ECFDF5', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <IndianRupee size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', fontFamily: 'Outfit, sans-serif' }}>
              ₹{Number(stats.todayRevenue || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '4px' }}>
              Total collections today
            </div>
          </div>

          {/* Today's Expenses */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Today's Expenses
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#F1F5F9', color: '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <TrendingDown size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#334155', fontFamily: 'Outfit, sans-serif' }}>
              ₹{Number(stats.todayExpenses || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '4px' }}>
              Operational outflows today
            </div>
          </div>

          {/* Today's Net Profit */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Today's Profit
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#EFF6FF', color: '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Activity size={16} />
              </div>
            </div>
            <div style={{
              fontSize: '1.45rem', fontWeight: 800,
              color: stats.todayProfit >= 0 ? '#059669' : '#DC2626',
              fontFamily: 'Outfit, sans-serif'
            }}>
              ₹{Number(stats.todayProfit || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '4px' }}>
              {stats.todayProfit >= 0 ? 'Net positive daily margin' : 'Deficit for today'}
            </div>
          </div>

          {/* Pending Payments */}
          <div
            onClick={() => setActiveTab('payments')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending Payments
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#FFFBEB', color: '#D97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertCircle size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#D97706', fontFamily: 'Outfit, sans-serif' }}>
              ₹{Number(stats.pendingPayments || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '4px' }}>
              Awaiting settlement / due
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Today's Attendance Overview ────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Today's Attendance
              </h2>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, color: '#059669',
                background: '#ECFDF5', border: '1px solid #A7F3D0',
                padding: '2px 8px', borderRadius: '999px'
              }}>
                Live Facility Tracker
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
              Member check-in performance for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>

          <button
            onClick={() => setDrawerType('attendance')}
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '9px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#2563EB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>View Full Roster ({todayAttendanceList.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 3 Metric Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Present Today
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', fontFamily: 'Outfit, sans-serif', marginTop: '2px' }}>
              {presentCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '1px' }}>
              Checked-in members
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '12px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Expected / Absent
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#334155', fontFamily: 'Outfit, sans-serif', marginTop: '2px' }}>
              {absentOrExpected}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '1px' }}>
              Remaining active
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '12px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Attendance Rate
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', fontFamily: 'Outfit, sans-serif', marginTop: '2px' }}>
              {attendanceRate}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '1px' }}>
              Of active roster
            </div>
          </div>
        </div>

        {/* Attendance Visual Meter */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
            <span>Attendance Progress Today</span>
            <span>{presentCount} of {activeCount} Active Members Present</span>
          </div>
          <div style={{
            height: '9px',
            background: '#F1F5F9',
            borderRadius: '999px',
            overflow: 'hidden',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: `${attendanceRate}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
              borderRadius: '999px',
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>
        </div>

        {/* Live Check-ins Preview List */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
            Recent Facility Check-ins
          </div>
          {todayAttendanceList.length === 0 ? (
            <div style={{
              padding: '20px', textAlign: 'center', background: '#F8FAFC',
              borderRadius: '10px', border: '1px dashed #E2E8F0', color: '#64748B', fontSize: '0.82rem'
            }}>
              No check-ins logged yet today. Use the QR code or manual attendance to record attendance.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayAttendanceList.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: a.method === 'QR' ? '#EFF6FF' : '#FFFBEB',
                      color: a.method === 'QR' ? '#2563EB' : '#D97706',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif'
                    }}>
                      {(a.name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
                        {a.reg_id}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>
                      {a.checkin_time}
                    </div>
                    <span style={{
                      fontSize: '0.66rem', fontWeight: 700,
                      color: a.method === 'QR' ? '#2563EB' : '#D97706'
                    }}>
                      {a.method === 'QR' ? '⚡ QR Scan' : '✏️ Manual'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Membership Overview ──────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Membership Overview
            </h2>
            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
              Current breakdown of gym member statuses
            </span>
          </div>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              background: 'none', border: 'none', color: '#2563EB',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '3px'
            }}
          >
            All Members <ArrowRight size={13} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px'
        }}>
          {/* Active Memberships */}
          <div
            onClick={() => setDrawerType('active')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Members
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#ECFDF5', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Users size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#059669', fontFamily: 'Outfit, sans-serif' }}>
              {stats.activeMembers}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
              Full facility access
            </div>
            <div style={{ fontSize: '0.7rem', color: '#2563EB', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              Click to view roster <ChevronRight size={12} />
            </div>
          </div>

          {/* Expiring Soon */}
          <div
            onClick={() => setDrawerType('expiring')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Expiring Soon
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#FFFBEB', color: '#D97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#D97706', fontFamily: 'Outfit, sans-serif' }}>
              {stats.expiringMemberships}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '4px', fontWeight: 600 }}>
              Expires within 30 days
            </div>
            <div style={{ fontSize: '0.7rem', color: '#D97706', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              Send reminder <ChevronRight size={12} />
            </div>
          </div>

          {/* Expired Memberships */}
          <div
            onClick={() => setActiveTab('members')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Expired Members
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#FEF2F2', color: '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <XCircle size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#DC2626', fontFamily: 'Outfit, sans-serif' }}>
              {stats.expiredMembers}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
              Requires renewal
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              View lapsed <ChevronRight size={12} />
            </div>
          </div>

          {/* Pending Memberships */}
          <div
            onClick={() => setDrawerType('pending')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending Members
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#EFF6FF', color: '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Clock size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#2563EB', fontFamily: 'Outfit, sans-serif' }}>
              {stats.pendingMemberships}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
              Pending activation
            </div>
            <div style={{ fontSize: '0.7rem', color: '#2563EB', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              Review pending <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 5: Member Activity Stream ───────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        {/* Activity Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Member Activity
            </h2>
            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
              Live registration, check-in, and renewal records
            </span>
          </div>

          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            borderRadius: '9px',
            padding: '3px',
            gap: '2px'
          }}>
            <button
              onClick={() => setActivityTab('registrations')}
              style={{
                background: activityTab === 'registrations' ? '#FFFFFF' : 'none',
                color: activityTab === 'registrations' ? '#0F172A' : '#64748B',
                border: 'none',
                borderRadius: '7px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activityTab === 'registrations' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              New Members ({recentRegistrationsList.length})
            </button>
            <button
              onClick={() => setActivityTab('attendance')}
              style={{
                background: activityTab === 'attendance' ? '#FFFFFF' : 'none',
                color: activityTab === 'attendance' ? '#0F172A' : '#64748B',
                border: 'none',
                borderRadius: '7px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activityTab === 'attendance' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Today's Active ({todayAttendanceList.length})
            </button>
            <button
              onClick={() => setActivityTab('expiring')}
              style={{
                background: activityTab === 'expiring' ? '#FFFFFF' : 'none',
                color: activityTab === 'expiring' ? '#0F172A' : '#64748B',
                border: 'none',
                borderRadius: '7px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activityTab === 'expiring' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Renewals ({expiringMembersList.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Recent Registrations */}
        {activityTab === 'registrations' && (
          <div>
            {recentRegistrationsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '0.84rem' }}>
                No recent member registrations recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentRegistrationsList.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', background: '#F8FAFC', borderRadius: '12px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: '#EFF6FF', border: '1px solid #DBEAFE',
                        color: '#2563EB', fontWeight: 800, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontFamily: 'Outfit, sans-serif'
                      }}>
                        {(r.full_name || 'N').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.full_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                          <span style={{ fontFamily: 'monospace', color: '#2563EB', fontWeight: 600 }}>{r.registration_id}</span>
                          {r.phone ? ` · ${r.phone}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                        {r.plan_name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                        Joined: {r.joining_date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setActiveTab('members')}
              style={{
                width: '100%', marginTop: '12px', padding: '10px',
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '10px', color: '#2563EB', fontWeight: 700,
                fontSize: '0.82rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <span>View All {recentRegistrationsList.length} Registrations in Hub</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Tab 2: Today's Active Check-ins */}
        {activityTab === 'attendance' && (
          <div>
            {todayAttendanceList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '0.84rem' }}>
                No check-ins logged today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayAttendanceList.slice(0, 5).map((a) => (
                  <AttendanceRow key={a.id} a={a} />
                ))}
              </div>
            )}
            <button
              onClick={() => setActiveTab('attendance')}
              style={{
                width: '100%', marginTop: '12px', padding: '10px',
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '10px', color: '#2563EB', fontWeight: 700,
                fontSize: '0.82rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <span>Open Live Attendance Hub</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Tab 3: Expiring / Renewals */}
        {activityTab === 'expiring' && (
          <div>
            {expiringMembersList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '0.84rem' }}>
                No memberships currently expiring within 30 days.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {expiringMembersList.slice(0, 5).map((m) => (
                  <ExpiringRow key={m.id} m={m} />
                ))}
              </div>
            )}
            <button
              onClick={() => setDrawerType('expiring')}
              style={{
                width: '100%', marginTop: '12px', padding: '10px',
                background: '#FFFBEB', border: '1px solid #FDE68A',
                borderRadius: '10px', color: '#D97706', fontWeight: 700,
                fontSize: '0.82rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <span>Review All {expiringMembersList.length} Expiring Memberships</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Slide-in Drawer for Detail Inspection ────────────────────────────── */}
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
