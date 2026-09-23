import React from 'react';
import { Dumbbell, ArrowLeft, ShieldCheck, Settings, Megaphone, LogOut } from 'lucide-react';

const TAB_INFO = {
  dashboard: { title: 'Dashboard', isMain: true },
  members: { title: 'Members', isMain: true },
  payments: { title: 'Finance & Expenses', isMain: true },
  attendance: { title: 'Attendance', isMain: true },
  more: { title: 'All Modules', isMain: true },
  // Sub-modules
  plans: { title: 'Plans & Pricing', isMain: false },
  trainers: { title: 'Trainers', isMain: false },
  workouts: { title: 'Workouts & Diets', isMain: false },
  leads: { title: 'Leads CRM', isMain: false },
  feedback: { title: 'Feedback & Reviews', isMain: false },
  broadcast: { title: 'Push & Offers', isMain: false },
  reports: { title: 'Reports & Export', isMain: false },
  'payment-qr': { title: 'UPI Payment QR', isMain: false },
  'gym-media': { title: 'Gym Media & Maps', isMain: false },
  settings: { title: 'Gym Settings', isMain: false },
};

export default function MobileHeader({ activeTab, setActiveTab, onLogout }) {
  const current = TAB_INFO[activeTab] || { title: 'Elite Fitness', isMain: true };

  const handleBack = () => {
    setActiveTab('more');
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(11, 15, 23, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
      paddingTop: 'max(8px, env(safe-area-inset-top))',
      paddingBottom: '8px',
      paddingLeft: '14px',
      paddingRight: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px',
      boxSizing: 'content-box',
    }}>
      {/* Left side: Back Button OR Gym Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {!current.isMain ? (
          <button
            onClick={handleBack}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Go back"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)'
          }}>
            <Dumbbell size={18} color="#000" />
          </div>
        )}

        <div style={{ minWidth: 0, lineHeight: 1.2 }}>
          <h1 style={{
            fontSize: current.isMain ? '1.05rem' : '1.1rem',
            fontWeight: 800,
            color: '#F9FAFB',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {current.isMain ? (
              <>ELITE <span style={{ color: '#F59E0B' }}>FITNESS</span></>
            ) : (
              current.title
            )}
          </h1>
          {current.isMain && (
            <div style={{ fontSize: '0.65rem', color: '#9CA3AF', letterSpacing: '0.06em', fontWeight: 700 }}>
              {current.title === 'Dashboard' ? 'OWNER PORTAL' : current.title.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {activeTab === 'dashboard' && (
          <button
            onClick={() => setActiveTab('broadcast')}
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '9px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              cursor: 'pointer'
            }}
            title="Push & Offers"
          >
            <Megaphone size={16} />
          </button>
        )}

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: activeTab === 'settings' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '9px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeTab === 'settings' ? '#F59E0B' : '#9CA3AF',
            cursor: 'pointer'
          }}
          title="Gym Settings"
        >
          <Settings size={16} />
        </button>

        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '4px 8px',
          borderRadius: '999px',
          fontSize: '0.68rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#10B981' }} />
          LIVE
        </div>
      </div>
    </header>
  );
}
