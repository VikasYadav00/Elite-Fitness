import React, { useState, useEffect } from 'react';
import {
  CheckCircle, Clock, ShieldCheck, UserCheck, Dumbbell,
  ArrowRight, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api';

const QUICK_MEMBERS = [
  { reg_id: 'EF26091001', name: 'Rahul Sharma', phone: '9876543210', plan: 'Quarterly Beast Mode' },
  { reg_id: 'EF26091002', name: 'Priya Verma', phone: '9876543211', plan: 'Annual Champion' },
  { reg_id: 'EF26091003', name: 'Amit Patel', phone: '9876543212', plan: 'Monthly Pass' },
  { reg_id: 'EF26091004', name: 'Sneha Gupta', phone: '9876543213', plan: 'Quarterly Pass' },
  { reg_id: 'EF26091005', name: 'Vikram Singh', phone: '9876543214', plan: 'Half-Yearly Elite' }
];

export default function CheckinPortal() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckin = async (selectedMember = null) => {
    setError(null);
    const targetId = (selectedMember ? selectedMember.reg_id : identifier).trim().toUpperCase();

    if (!targetId) {
      setError('Please enter your Registration ID or Phone Number');
      return;
    }

    setLoading(true);

    // Security Check: Verify member status from custom members registry
    try {
      const customMembers = JSON.parse(localStorage.getItem('ef_custom_members') || '[]');
      const matchedCustom = customMembers.find(
        m => (m.registration_id && m.registration_id.toUpperCase() === targetId) ||
             (m.phone && m.phone === targetId)
      );

      if (matchedCustom) {
        if (matchedCustom.status === 'INACTIVE' || matchedCustom.payment_status === 'DUE' || matchedCustom.payment_status === 'PENDING') {
          setLoading(false);
          const reason = matchedCustom.payment_status === 'DUE'
            ? 'Cash payment pending at reception desk'
            : 'Payment verification pending';
          setError(`🚫 ACCESS DENIED: Membership is INACTIVE (${reason}). Please visit the gym reception desk to complete payment.`);
          return;
        }
      }
    } catch (_) {}

    // Find known member or create from identifier
    const known = QUICK_MEMBERS.find(
      m => m.reg_id.toUpperCase() === targetId || m.phone === targetId
    );

    const memberName = known ? known.name : (selectedMember ? selectedMember.name : `Member (${targetId})`);
    const regId = known ? known.reg_id : targetId;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = new Date().toISOString().split('T')[0];

    // Attempt backend attendance call with active membership verification
    try {
      const res = await api.post('/attendance/check-in', {
        registration_id: regId,
        method: 'QR_TABLE_SCAN',
        device_fingerprint: `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });
      if (res.data && res.data.success === false) {
        setLoading(false);
        setError(`🚫 ACCESS DENIED: ${res.data.message || 'Inactive membership.'}`);
        return;
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setLoading(false);
        setError('🚫 ACCESS DENIED: No active membership found. Please complete payment at the front desk.');
        return;
      }
    }

    // Broadcast check-in to Owner App via localStorage storage event
    try {
      const checkinEvent = {
        name: memberName,
        reg_id: regId,
        time: timeStr,
        date: today,
        timestamp: Date.now()
      };
      localStorage.setItem('ef_member_checkin', JSON.stringify(checkinEvent));

      // Append to attendance logs
      const logs = JSON.parse(localStorage.getItem('ef_attendance_logs') || '[]');
      const newEntry = {
        id: String(Date.now()),
        reg_id: regId,
        name: memberName,
        time: timeStr,
        method: 'QR (Table Scan)',
        device_id: `MOB-${Math.random().toString(36).substring(2, 6).toUpperCase()}**`,
        status: 'PRESENT'
      };
      const updated = [newEntry, ...logs.filter(l => l.reg_id !== regId)];
      localStorage.setItem('ef_attendance_logs', JSON.stringify(updated));
    } catch (_) {}

    setLoading(false);
    setCheckedIn({
      name: memberName,
      reg_id: regId,
      time: timeStr,
      date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}
  };

  return (
    <div style={{
      maxWidth: '520px',
      margin: '0 auto',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Gym Branding Header */}
      <div style={{
        textAlign: 'center',
        padding: '24px 20px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)'
        }}>
          <Dumbbell size={28} color="#000" />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F9FAFB', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          ELITE <span style={{ color: '#F59E0B' }}>FITNESS</span>
        </h1>
        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          ⚡ Daily Desk Attendance Check-In
        </div>

        {/* Live Clock Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '14px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '0.82rem',
          color: '#F3F4F6'
        }}>
          <Clock size={14} color="#F59E0B" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span style={{ color: '#6B7280' }}>•</span>
          <span>{currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {/* Success Confirmation Card */}
      {checkedIn ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '2px solid #10B981',
          borderRadius: '20px',
          padding: '28px 20px',
          textAlign: 'center',
          boxShadow: '0 12px 36px rgba(16, 185, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981'
          }}>
            <CheckCircle size={38} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
              Attendance Marked!
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 700, margin: 0 }}>
              Welcome, {checkedIn.name}! 💪
            </p>
          </div>

          <div style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '14px',
            padding: '16px',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9CA3AF' }}>Registration ID:</span>
              <span style={{ fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace' }}>{checkedIn.reg_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9CA3AF' }}>Check-in Time:</span>
              <span style={{ fontWeight: 700, color: '#F9FAFB' }}>{checkedIn.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9CA3AF' }}>Date:</span>
              <span style={{ color: '#D1D5DB' }}>{checkedIn.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9CA3AF' }}>Status:</span>
              <span style={{ color: '#10B981', fontWeight: 800 }}>✓ PRESENT (Gym Floor Access)</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            Your attendance has been sent to the gym owner portal. Have a great workout session! 🔥
          </p>

          <button
            onClick={() => { setCheckedIn(null); setIdentifier(''); }}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#F9FAFB',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '6px'
            }}
          >
            Check In Another Member
          </button>
        </div>
      ) : (
        /* Checkin Form Card */
        <div style={{
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F9FAFB', margin: '0 0 6px' }}>
              Enter Your Registration ID or Phone
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
              Scan the table standee at reception and tap Check In to record your attendance.
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleCheckin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#9CA3AF', marginBottom: '6px', fontWeight: 700 }}>
                Registration ID or Mobile Number
              </label>
              <input
                type="text"
                placeholder="e.g. EF26091001 or 9876543210"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>Verifying & Marking Attendance...</>
              ) : (
                <>
                  <CheckCircle size={20} /> Mark Attendance / Check In
                </>
              )}
            </button>
          </form>

          {/* 1-Tap Quick Select Members */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '10px' }}>
              ⚡ OR TAP YOUR NAME FOR 1-CLICK CHECK-IN:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {QUICK_MEMBERS.map(member => (
                <div
                  key={member.reg_id}
                  onClick={() => handleCheckin(member)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem'
                    }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F9FAFB' }}>{member.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontFamily: 'monospace' }}>{member.reg_id}</div>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    Check In <ArrowRight size={12} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Switch to Registration Link */}
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9CA3AF' }}>
        New to Elite Fitness?{' '}
        <a href="/" style={{ color: '#F59E0B', fontWeight: 700, textDecoration: 'none' }}>
          Register for a Membership →
        </a>
      </div>
    </div>
  );
}
