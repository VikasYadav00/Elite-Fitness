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
      background: '#FFFFFF',
      borderBottom: '1px solid #DCEBFA',
      boxShadow: '0 1px 6px rgba(77, 166, 255, 0.1)',
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
            background: isSidebarOpen ? '#EAF5FF' : '#F8FBFF',
            border: isSidebarOpen ? '1px solid #4DA6FF' : '1px solid #DCEBFA',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSidebarOpen ? '#4DA6FF' : '#1F2937',
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

        {/* Brand Text */}
        <div style={{ lineHeight: 1.1 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1F2937', margin: 0, letterSpacing: '-0.01em' }}>
            ELITE <span style={{ color: '#4DA6FF' }}>FITNESS</span>
          </h2>
          <span style={{ fontSize: '0.625rem', color: '#6B7280', letterSpacing: '0.08em', fontWeight: 700 }}>
            OWNER PORTAL
          </span>
        </div>

        {/* Active Module Pill on Mobile & Tablet */}
        <div className="active-module-pill" style={{
          display: 'none',
          padding: '3px 10px',
          background: '#EAF5FF',
          border: '1px solid #BAE6FD',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#0284C7',
          whiteSpace: 'nowrap'
        }}>
          {currentTitle}
        </div>
      </div>

      {/* Right: Status & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="nav-status-badge" style={{
          background: '#ECFDF5',
          color: '#059669',
          border: '1px solid #A7F3D0',
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
