import React, { useEffect, useState } from 'react';
import {
  Dumbbell, CheckCircle, FileText, Star, PhoneCall,
  ChevronRight, MapPin, Phone, Clock, Wifi, WifiOff
} from 'lucide-react';
import api from '../api';

const SERVICES = [
  {
    id: 'checkin',
    emoji: '🏋️',
    icon: CheckCircle,
    title: 'Daily Attendance',
    subtitle: 'Mark today\'s gym attendance',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    path: '/checkin'
  },
  {
    id: 'register',
    emoji: '📝',
    icon: FileText,
    title: 'New Registration',
    subtitle: 'Become an Elite Fitness member',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    path: '/register'
  },
  {
    id: 'feedback',
    emoji: '⭐',
    icon: Star,
    title: 'Feedback & Review',
    subtitle: 'Share your experience with us',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.10)',
    border: 'rgba(245, 158, 11, 0.30)',
    path: '/feedback'
  },
  {
    id: 'complaint',
    emoji: '📞',
    icon: PhoneCall,
    title: 'Complaint & Support',
    subtitle: 'Need help? Contact us',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.10)',
    border: 'rgba(56, 189, 248, 0.30)',
    path: '/complaint'
  }
];

export default function UniversalPortal({ onNavigate }) {
  const [gymInfo, setGymInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    api.get('/settings/public')
      .then(res => {
        if (res.data?.data) setGymInfo(res.data.data);
      })
      .catch(() => {});
  }, []);

  const handleServiceSelect = (service) => {
    // Track service selection (optional analytics)
    try {
      const log = JSON.parse(localStorage.getItem('ef_qr_service_log') || '[]');
      log.unshift({ service: service.id.toUpperCase(), timestamp: new Date().toISOString() });
      localStorage.setItem('ef_qr_service_log', JSON.stringify(log.slice(0, 50)));
    } catch (_) {}

    if (onNavigate) {
      onNavigate(service.id);
    }
  };

  const gymName = gymInfo?.gym_name || 'Elite Fitness';
  const gymAddress = gymInfo?.address || 'Sector 14, Lucknow';
  const gymPhone = gymInfo?.phone || '8953933110';

  const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0B0F17 0%, #111827 60%, #0B0F17 100%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '0',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.98) 100%)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
        padding: '28px 20px 24px',
        textAlign: 'center'
      }}>
        {/* Logo badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '50px',
          padding: '6px 16px',
          marginBottom: '16px'
        }}>
          <Dumbbell size={18} color="#F59E0B" />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.08em', color: '#F9FAFB' }}>
            ELITE <span style={{ color: '#F59E0B' }}>FITNESS</span>
          </span>
        </div>

        <h1 style={{
          fontSize: '1.7rem',
          fontWeight: 900,
          color: '#F9FAFB',
          margin: '0 0 6px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          Welcome to Elite Fitness
        </h1>
        <p style={{ color: '#F59E0B', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 16px', lineHeight: 1.5 }}>
          Please select a service
        </p>

        {/* Live time + date */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '0.78rem',
          color: '#D1D5DB'
        }}>
          <Clock size={13} color="#F59E0B" />
          <span style={{ fontWeight: 700 }}>{timeStr}</span>
          <span style={{ color: '#4B5563' }}>•</span>
          <span>{dateStr}</span>
        </div>

        {/* Online indicator */}
        {!online && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '10px',
            fontSize: '0.75rem',
            color: '#F87171'
          }}>
            <WifiOff size={13} />
            <span>No internet connection — some services may be unavailable</span>
          </div>
        )}
      </div>

      {/* Service Cards */}
      <div style={{
        flex: 1,
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '520px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>

        <div style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '4px'
        }}>
          Select a service
        </div>

        {SERVICES.map((service) => (
          <button
            key={service.id}
            id={`qr-service-${service.id}`}
            onClick={() => handleServiceSelect(service)}
            style={{
              width: '100%',
              background: service.bg,
              border: `1.5px solid ${service.border}`,
              borderRadius: '18px',
              padding: '18px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px ${service.color}40`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
            }}
          >
            {/* Icon */}
            <div style={{
              width: '52px',
              height: '52px',
              minWidth: '52px',
              borderRadius: '14px',
              background: `${service.color}20`,
              border: `1px solid ${service.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {service.emoji}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: '#F9FAFB',
                marginBottom: '3px',
                letterSpacing: '-0.01em'
              }}>
                {service.title}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#94A3B8',
                lineHeight: 1.4
              }}>
                {service.subtitle}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight size={20} color={service.color} style={{ minWidth: '20px' }} />
          </button>
        ))}

        {/* Gym info footer card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '14px 16px',
          marginTop: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Gym Info
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#D1D5DB' }}>
            <MapPin size={14} color="#F59E0B" />
            <span>{gymAddress}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#D1D5DB' }}>
            <Phone size={14} color="#10B981" />
            <a href={`tel:${gymPhone}`} style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>{gymPhone}</a>
          </div>
          {online && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#10B981' }}>
              <Wifi size={12} />
              <span>All services available</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '16px',
        color: '#374151',
        fontSize: '0.7rem'
      }}>
        © {new Date().getFullYear()} Elite Fitness • Powered by Elite Fitness Management System
      </div>
    </div>
  );
}
