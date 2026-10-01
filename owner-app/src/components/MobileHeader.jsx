import React from 'react';
import { Dumbbell, ArrowLeft, Settings, Megaphone } from 'lucide-react';

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
  complaints: { title: 'Complaints & Support', isMain: false },
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
      background: '#FFFFFF',
      borderBottom: '1px solid #DCEBFA',
      boxShadow: '0 1px 6px rgba(77, 166, 255, 0.1)',
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
              background: '#EAF5FF',
              border: '1px solid #DCEBFA',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4DA6FF',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background-color 0.15s ease'
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
            background: 'linear-gradient(135deg, #4DA6FF, #2E8FE8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(77, 166, 255, 0.35)',
          }}>
            <Dumbbell size={18} color="#FFFFFF" />
          </div>
        )}

        <div style={{ minWidth: 0, lineHeight: 1.2 }}>
          <h1 style={{
            fontSize: current.isMain ? '1.05rem' : '1.1rem',
            fontWeight: 800,
            color: '#1F2937',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {current.isMain ? (
              <>ELITE <span style={{ color: '#4DA6FF' }}>FITNESS</span></>
            ) : (
              current.title
            )}
          </h1>
          {current.isMain && (
            <div style={{ fontSize: '0.62rem', color: '#6B7280', letterSpacing: '0.06em', fontWeight: 700, textTransform: 'uppercase' }}>
              {current.title === 'Dashboard' ? 'Owner Portal' : current.title}
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
              background: '#EAF5FF',
              border: '1px solid #DCEBFA',
              borderRadius: '9px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4DA6FF',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            title="Push & Offers"
          >
            <Megaphone size={16} />
          </button>
        )}

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: activeTab === 'settings' ? '#EAF5FF' : '#F8FBFF',
            border: '1px solid #DCEBFA',
            borderRadius: '9px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeTab === 'settings' ? '#4DA6FF' : '#6B7280',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          title="Gym Settings"
        >
          <Settings size={16} />
        </button>

        {/* Live Indicator */}
        <div style={{
          background: '#ECFDF5',
          color: '#059669',
          border: '1px solid #A7F3D0',
          padding: '4px 9px',
          borderRadius: '999px',
          fontSize: '0.68rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '999px',
            background: '#059669',
            animation: 'pulse-dot 2s ease-in-out infinite'
          }} />
          LIVE
        </div>
      </div>
    </header>
  );
}
