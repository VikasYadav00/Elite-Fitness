import React from 'react';
import {
  LayoutDashboard, Users, Award, CreditCard, Clock, UserCheck,
  Dumbbell, Target, Megaphone, FileSpreadsheet, Settings, X,
  Dumbbell as GymIcon, Sparkles, MapPin, Star
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'plans', label: 'Plans & Pricing', icon: Award },
  { id: 'payments', label: 'Finance & Expenses', icon: CreditCard },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'trainers', label: 'Trainers', icon: UserCheck },
  { id: 'workouts', label: 'Workouts & Diets', icon: Dumbbell },
  { id: 'leads', label: 'Leads CRM', icon: Target },
  { id: 'feedback', label: 'Feedback & Reviews', icon: Star },
  { id: 'broadcast', label: 'Push & Offers', icon: Megaphone },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'payment-qr', label: 'UPI Payment QR', icon: CreditCard },
  { id: 'gym-media', label: 'Gym Media & Maps', icon: MapPin },
  { id: 'settings', label: 'Gym Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }) {
  const handleItemClick = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer / Sidebar container */}
      <aside className={`sidebar-drawer ${isOpen ? 'open' : ''}`}>
        {/* Mobile Header with Close Button */}
        <div className="sidebar-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4DA6FF, #2E8FE8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(77, 166, 255, 0.35)'
            }}>
              <GymIcon size={16} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1F2937', lineHeight: 1 }}>
                NAVIGATION <span style={{ color: '#4DA6FF' }}>MENU</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>SELECT MODULE</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="sidebar-close-btn"
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="sidebar-items-list">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`sidebar-item-btn ${isActive ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <Icon
                    size={20}
                    color={isActive ? '#4DA6FF' : '#9CA3AF'}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                    background: isActive ? '#4DA6FF' : '#EAF5FF',
                    color: isActive ? '#FFFFFF' : '#0284C7',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid #DCEBFA',
          marginTop: 'auto',
          fontSize: '0.72rem',
          color: '#6B7280',
          textAlign: 'center'
        }}>
          Elite Fitness Mobile v1.0
        </div>
      </aside>
    </>
  );
}
