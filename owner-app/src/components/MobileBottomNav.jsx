import React from 'react';
import {
  LayoutDashboard, Users, CreditCard, Clock, Grid
} from 'lucide-react';

const SUB_MODULES = ['plans', 'trainers', 'workouts', 'leads', 'broadcast', 'reports', 'settings'];

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
      background: 'rgba(11, 15, 23, 0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(245, 158, 11, 0.25)',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      paddingTop: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: '60px',
      boxSizing: 'content-box',
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.6)'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;

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
              color: active ? '#F59E0B' : '#94A3B8',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '28px',
              borderRadius: '999px',
              background: active ? 'rgba(245, 158, 11, 0.16)' : 'transparent',
              transition: 'all 0.2s ease'
            }}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} color={active ? '#F59E0B' : '#94A3B8'} />
            </div>

            <span style={{
              fontSize: '0.675rem',
              fontWeight: active ? 800 : 500,
              letterSpacing: '0.01em',
              lineHeight: 1
            }}>
              {tab.label}
            </span>

            {active && (
              <div style={{
                position: 'absolute',
                top: 0,
                width: '16px',
                height: '2px',
                background: '#F59E0B',
                borderRadius: '999px',
                boxShadow: '0 0 8px #F59E0B'
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
