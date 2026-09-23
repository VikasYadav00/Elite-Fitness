import React, { useState } from 'react';
import {
  Award, UserCheck, Dumbbell, Target, Megaphone,
  FileSpreadsheet, Settings, LogOut, ChevronRight,
  Wifi, Shield, PhoneCall, Sparkles, Building, MapPin,
  CreditCard, Star
} from 'lucide-react';
import { getApiBaseUrl } from '../api';

const MODULE_GROUPS = [
  {
    groupTitle: 'Gym Operations & Services',
    items: [
      {
        id: 'plans',
        title: 'Plans & Pricing',
        desc: 'Manage memberships, durations, pricing & popular badges',
        icon: Award,
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.15)',
      },
      {
        id: 'trainers',
        title: 'Trainers & Staff',
        desc: 'Instructor profiles, specializations & member counts',
        icon: UserCheck,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.15)',
      },
      {
        id: 'workouts',
        title: 'Workouts & Nutrition',
        desc: 'Workout routine splits & dietary plan templates',
        icon: Dumbbell,
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.15)',
      },
      {
        id: 'leads',
        title: 'Leads CRM',
        desc: 'Inquiries, walk-in leads & conversion pipeline',
        icon: Target,
        color: '#EC4899',
        bg: 'rgba(236, 72, 153, 0.15)',
      },
    ],
  },
  {
    groupTitle: 'Communication & Analytics',
    items: [
      {
        id: 'feedback',
        title: 'Feedback & Reviews',
        desc: 'Member star ratings, Google Lens review QR standee & reviews',
        icon: Star,
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.15)',
      },
      {
        id: 'broadcast',
        title: 'Push & Offers',
        desc: 'Broadcast SMS, WhatsApp & app announcements',
        icon: Megaphone,
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.15)',
      },
      {
        id: 'reports',
        title: 'Reports & Export',
        desc: 'Export Excel reports with custom date ranges',
        icon: FileSpreadsheet,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.15)',
      },
    ],
  },
  {
    groupTitle: 'System & Gym Setup',
    items: [
      {
        id: 'payment-qr',
        title: 'UPI Payment QR',
        desc: 'Configure UPI ID, upload merchant QR & download counter standee',
        icon: CreditCard,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.15)',
      },
      {
        id: 'gym-media',
        title: 'Gym Media & Google Maps',
        desc: 'Upload gym photos & tour clips shown on Google Maps search',
        icon: MapPin,
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.15)',
      },
      {
        id: 'settings',
        title: 'Gym Settings & Registration QR',
        desc: 'Gym profile info, registration standee & password security',
        icon: Settings,
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.15)',
      },
    ],
  },
];

export default function MoreView({ setActiveTab, onLogout }) {
  const [showIpModal, setShowIpModal] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveIp = (e) => {
    e.preventDefault();
    localStorage.setItem('elite_fitness_api_url', serverUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowIpModal(false);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
      {/* Gym Owner Profile Header Card */}
      <div className="glass-card" style={{
        padding: '18px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(17,24,39,0.92) 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        border: '1px solid rgba(245,158,11,0.35)'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: 900,
          fontSize: '1.25rem',
          flexShrink: 0,
          boxShadow: '0 4px 14px rgba(245,158,11,0.35)'
        }}>
          EF
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
              Elite Fitness Gym
            </h2>
            <Sparkles size={15} color="#F59E0B" />
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
            Owner Administrator Portal
          </p>
        </div>

        <button
          onClick={onLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Logout"
        >
          <LogOut size={14} />
          <span>Exit</span>
        </button>
      </div>

      {/* Module Groups */}
      {MODULE_GROUPS.map((group, idx) => (
        <div key={idx}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
            paddingLeft: '4px'
          }}>
            {group.groupTitle}
          </div>

          <div style={{
            background: 'rgba(17, 24, 39, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {group.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    borderBottom: i < group.items.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                    transition: 'background 0.15s ease',
                    minHeight: '56px'
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.background = ''; }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: item.bg,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F9FAFB' }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: '0.74rem',
                      color: '#9CA3AF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px'
                    }}>
                      {item.desc}
                    </div>
                  </div>

                  <ChevronRight size={18} color="#64748B" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Connectivity & Server Settings Card */}
      <div>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
          paddingLeft: '4px'
        }}>
          Network & Backend Sync
        </div>

        <div style={{
          background: 'rgba(17, 24, 39, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => setShowIpModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              cursor: 'pointer',
              minHeight: '56px'
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Wifi size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F9FAFB' }}>
                Server Connection IP
              </div>
              <div style={{
                fontSize: '0.74rem',
                color: '#10B981',
                fontFamily: 'monospace',
                marginTop: '2px'
              }}>
                {serverUrl}
              </div>
            </div>

            <span style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#F59E0B',
              fontSize: '0.72rem',
              fontWeight: 700,
              flexShrink: 0
            }}>
              Edit
            </span>
          </div>
        </div>
      </div>

      {/* Server IP Config Modal */}
      {showIpModal && (
        <div className="modal-overlay" onClick={() => setShowIpModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', color: '#F59E0B', fontWeight: 800, marginBottom: '8px' }}>
              📡 Configure Backend Server IP
            </h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '16px' }}>
              When testing this APK on different Wi-Fi networks, update your PC's IP address here so the phone can sync live data.
            </p>

            <form onSubmit={handleSaveIp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">API Base URL</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="http://192.168.1.49:5000/api"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  required
                />
              </div>

              {savedSuccess && (
                <div style={{ color: '#10B981', fontSize: '0.82rem', fontWeight: 700 }}>
                  ✓ Server URL saved! Reloading live sync.
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowIpModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
