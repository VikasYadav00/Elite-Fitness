import React, { useState } from 'react';
import BottomNav from './components/BottomNav';
import HomeView from './views/HomeView';
import WorkoutView from './views/WorkoutView';
import DietView from './views/DietView';
import QRPassView from './views/QRPassView';
import ProfileView from './views/ProfileView';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
      <main style={{ paddingBottom: '20px' }}>
        {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} />}
        {activeTab === 'workout' && <WorkoutView />}
        {activeTab === 'diet' && <DietView />}
        {activeTab === 'pass' && <QRPassView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
