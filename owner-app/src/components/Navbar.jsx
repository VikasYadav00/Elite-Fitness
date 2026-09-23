import React from 'react';
import { Dumbbell, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

const TAB_TITLES = {
  dashboard: 'Dashboard',
  members: 'Members',
  plans: 'Plans & Pricing',
  payments: 'Finance & Expenses',
  attendance: 'Attendance',
  trainers: 'Trainers',
  workouts: 'Workouts & Diets',
  leads: 'Leads CRM',
  broadcast: 'Push & Offers',
  reports: 'Reports',
  settings: 'Gym Settings',
};

export default function Navbar({ onLogout, activeTab, isSidebarOpen, onToggleSidebar }) {
  const currentTitle = TAB_TITLES[activeTab] || 'Dashboard';

  return (
    <header style={{
      height: '60px',
      background: 'rgba(13, 19, 31, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Left: Menu Toggle + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Navbar Open Button (Mobile & Desktop Hamburger) */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          style={{
            background: isSidebarOpen ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: isSidebarOpen ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSidebarOpen ? '#F59E0B' : '#F9FAFB',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title={isSidebarOpen ? "Close navigation" : "Open navigation menu"}
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo Icon */}
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '9px',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Dumbbell size={18} color="#000" />
        </div>

        {/* Brand Text */}
        <div style={{ lineHeight: 1.1 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F9FAFB', margin: 0, letterSpacing: '-0.01em' }}>
            ELITE <span style={{ color: '#F59E0B' }}>FITNESS</span>
          </h2>
          <span style={{ fontSize: '0.625rem', color: '#9CA3AF', letterSpacing: '0.08em', fontWeight: 700 }}>
            OWNER PORTAL
          </span>
        </div>

        {/* Active Module Pill on Mobile & Tablet */}
        <div className="active-module-pill" style={{
          display: 'none',
          padding: '3px 10px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#F59E0B',
          whiteSpace: 'nowrap'
        }}>
          {currentTitle}
        </div>
      </div>

      {/* Right: Status & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="nav-status-badge" style={{
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <ShieldCheck size={13} />
          <span className="nav-status-text">ONLINE</span>
        </div>

        <button
          onClick={onLogout}
          className="btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '0.78rem',
            height: '36px',
            gap: '6px'
          }}
          title="Logout"
        >
          <LogOut size={15} />
          <span className="nav-logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
}
