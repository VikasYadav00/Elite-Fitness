import React from 'react';
import { Dumbbell, ShieldCheck, Flame, Calendar, ArrowRight, Bell, Sparkles, ChevronRight } from 'lucide-react';

export default function HomeView({ setActiveTab }) {
  const member = {
    name: 'Rahul Sharma',
    reg_id: 'EF26091001',
    plan_name: 'Quarterly Beast Mode',
    days_left: 48,
    status: 'ACTIVE',
    end_date: '15 Dec 2026',
    streak: 12
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Welcome back 👋</span>
          <h2 style={{ fontSize: '1.4rem', color: '#F8FAFC' }}>{member.name}</h2>
        </div>
        <div style={{
          padding: '8px 14px',
          borderRadius: '9999px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#F59E0B',
          fontSize: '0.8rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Flame size={16} color="#F59E0B" /> {member.streak} Day Streak!
        </div>
      </div>

      {/* Digital Membership Pass Banner Card */}
      <div className="glass-card" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(18, 26, 43, 0.95) 100%)',
        border: '1.5px solid #F59E0B',
        boxShadow: '0 12px 30px rgba(245, 158, 11, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ELITE FITNESS PASS
            </span>
            <h3 style={{ fontSize: '1.25rem', color: '#F8FAFC' }}>{member.plan_name}</h3>
          </div>
          <span style={{ background: '#10B981', color: '#000', fontSize: '0.7rem', fontWeight: 900, padding: '3px 10px', borderRadius: '9999px' }}>
            {member.status}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>REGISTRATION ID</span>
            <div style={{ fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace', fontSize: '1.1rem' }}>{member.reg_id}</div>
          </div>

          <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.825rem' }} onClick={() => setActiveTab('pass')}>
            Show QR Pass <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '18px', cursor: 'pointer' }} onClick={() => setActiveTab('workout')}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', width: 'fit-content', marginBottom: '12px' }}>
            <Dumbbell size={22} />
          </div>
          <h4 style={{ fontSize: '1rem', color: '#F8FAFC' }}>Today's Workout</h4>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Chest & Triceps Hypertrophy</p>
        </div>

        <div className="glass-card" style={{ padding: '18px', cursor: 'pointer' }} onClick={() => setActiveTab('diet')}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', width: 'fit-content', marginBottom: '12px' }}>
            <Sparkles size={22} />
          </div>
          <h4 style={{ fontSize: '1rem', color: '#F8FAFC' }}>Nutrition Plan</h4>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>High Protein (2,800 kcal)</p>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="glass-card" style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', shrink: 0 }}>
          <Bell size={22} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.925rem', color: '#F8FAFC' }}>New Cardio Zone Upgrade!</h4>
          <p style={{ fontSize: '0.775rem', color: '#94A3B8', marginTop: '2px' }}>We have added 5 new commercial treadmills & stairmasters to the main floor.</p>
        </div>
      </div>
    </div>
  );
}
