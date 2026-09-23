import React, { useState, useEffect } from 'react';
import MobileHeader from './components/MobileHeader';
import MobileBottomNav from './components/MobileBottomNav';
import DashboardView from './views/DashboardView';
import MembersView from './views/MembersView';
import PaymentsView from './views/PaymentsView';
import AttendanceView from './views/AttendanceView';
import MoreView from './views/MoreView';
import PlansView from './views/PlansView';
import TrainersView from './views/TrainersView';
import WorkoutsDietsView from './views/WorkoutsDietsView';
import LeadsView from './views/LeadsView';
import BroadcastView from './views/BroadcastView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import GymMediaMapView from './views/GymMediaMapView';
import PaymentQRView from './views/PaymentQRView';
import FeedbackReviewsView from './views/FeedbackReviewsView';
import LoginView from './views/LoginView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check persisted login on app start
  useEffect(() => {
    const token = sessionStorage.getItem('owner_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, []);

  // Scroll to top smoothly on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleLoginSuccess = (token, user) => {
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of Elite Fitness Owner Portal?')) {
      sessionStorage.removeItem('owner_token');
      sessionStorage.removeItem('owner_user');
      setIsAuthenticated(false);
      setActiveTab('dashboard');
    }
  };

  // Show nothing until auth check is complete (prevents flash)
  if (!authChecked) return null;

  // Show Login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0F17',
      color: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* Native Mobile Top Bar */}
      <MobileHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main View Area with Bottom-Nav safe-area padding */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '14px 14px 90px 14px',
        boxSizing: 'border-box'
      }}>
        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
        {activeTab === 'members' && <MembersView setActiveTab={setActiveTab} />}
        {activeTab === 'payments' && <PaymentsView />}
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'more' && <MoreView setActiveTab={setActiveTab} onLogout={handleLogout} />}

        {/* Sub-Views navigated from More Menu */}
        {activeTab === 'plans' && <PlansView />}
        {activeTab === 'trainers' && <TrainersView />}
        {activeTab === 'workouts' && <WorkoutsDietsView />}
        {activeTab === 'leads' && <LeadsView />}
        {activeTab === 'feedback' && <FeedbackReviewsView />}
        {activeTab === 'broadcast' && <BroadcastView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'payment-qr' && <PaymentQRView />}
        {activeTab === 'gym-media' && <GymMediaMapView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Native Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
