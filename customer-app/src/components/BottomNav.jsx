import React from 'react';
import { Home, Dumbbell, Utensils, QrCode, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'diet', label: 'Diet', icon: Utensils },
    { id: 'pass', label: 'QR Pass', icon: QrCode },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={22} color={isActive ? '#F59E0B' : '#94A3B8'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
