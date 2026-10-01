import React from 'react';
import {
  LayoutDashboard, Users, CreditCard, Clock, Grid
} from 'lucide-react';

const SUB_MODULES = ['plans', 'trainers', 'workouts', 'leads', 'broadcast', 'reports',
  'settings', 'feedback', 'complaints', 'payment-qr', 'gym-media'];

export default function MobileBottomNav({ activeTab, setActiveTab }) {
  const isMoreActive = activeTab === 'more' || SUB_MODULES.includes(activeTab);

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, isActive: activeTab === 'dashboard' },
    { id: 'members', label: 'Members', icon: Users, isActive: activeTab === 'members' },
    { id: 'payments', label: 'Finance', icon: CreditCard, isActive: activeTab === 'payments' },
    { id: 'attendance', label: 'Attendance', icon: Clock, isActive: activeTab === 'attendance' },
    { id: 'more', label: 'Menu', icon: Grid, isActive: isMoreActive },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: '#FFFFFF',
      borderTop: '1px solid #DCEBFA',
      boxShadow: '0 -2px 10px rgba(77, 166, 255, 0.08)',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      paddingTop: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: '60px',
      boxSizing: 'content-box',
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;
        const ACTIVE_COLOR = '#4DA6FF';
        const INACTIVE_COLOR = '#9CA3AF';

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              color: active ? ACTIVE_COLOR : INACTIVE_COLOR,
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '28px',
              borderRadius: '999px',
              background: active ? 'rgba(77, 166, 255, 0.12)' : 'transparent',
              transition: 'all 0.2s ease',
            }}>
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                color={active ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            </div>

            <span style={{
              fontSize: '0.66rem',
              fontWeight: active ? 800 : 500,
              letterSpacing: '0.01em',
              lineHeight: 1,
              color: active ? ACTIVE_COLOR : INACTIVE_COLOR,
            }}>
              {tab.label}
            </span>

            {/* Active top-indicator pill */}
            {active && (
              <div style={{
                position: 'absolute',
                top: 0,
                width: '18px',
                height: '2.5px',
                background: ACTIVE_COLOR,
                borderRadius: '999px',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
