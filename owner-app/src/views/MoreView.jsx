import React, { useState } from 'react';
import {
  Award, UserCheck, Dumbbell, Target, Megaphone,
  FileSpreadsheet, Settings, LogOut, ChevronRight,
  Wifi, PhoneCall, Sparkles, MapPin,
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
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
      },
      {
        id: 'trainers',
        title: 'Trainers & Staff',
        desc: 'Instructor profiles, specializations & member counts',
        icon: UserCheck,
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0',
      },
      {
        id: 'workouts',
        title: 'Workouts & Nutrition',
        desc: 'Workout routine splits & dietary plan templates',
        icon: Dumbbell,
        color: '#4DA6FF',
        bg: '#EAF5FF',
        border: '#DCEBFA',
      },
      {
        id: 'leads',
        title: 'Leads CRM',
        desc: 'Inquiries, walk-in leads & conversion pipeline',
        icon: Target,
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
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
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
      },
      {
        id: 'complaints',
        title: 'Complaints & Support',
        desc: 'View & manage support requests from the Universal QR',
        icon: PhoneCall,
        color: '#4DA6FF',
        bg: '#EAF5FF',
        border: '#DCEBFA',
      },
      {
        id: 'broadcast',
        title: 'Push & Offers',
        desc: 'Broadcast SMS, WhatsApp & app announcements',
        icon: Megaphone,
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
      },
      {
        id: 'reports',
        title: 'Reports & Export',
        desc: 'Export Excel reports with custom date ranges',
        icon: FileSpreadsheet,
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0',
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
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0',
      },
      {
        id: 'gym-media',
        title: 'Gym Media & Google Maps',
        desc: 'Upload gym photos & tour clips shown on Google Maps search',
        icon: MapPin,
        color: '#4DA6FF',
        bg: '#EAF5FF',
        border: '#DCEBFA',
      },
      {
        id: 'settings',
        title: 'Gym Settings & Universal QR',
        desc: 'Gym profile info, universal entrance QR standee & password security',
        icon: Settings,
        color: '#6B7280',
        bg: '#F9FAFB',
        border: '#E5E7EB',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '20px' }}>

      {/* ── Gym Owner Profile Header Card ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #4DA6FF 0%, #2E8FE8 100%)',
        borderRadius: '16px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 4px 16px rgba(77, 166, 255, 0.3)',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.25)',
          border: '1.5px solid rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: '1.15rem',
          flexShrink: 0,
          fontFamily: 'Outfit, sans-serif',
        }}>
          EF
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Elite Fitness Gym
            </h2>
            <Sparkles size={14} color="rgba(255,255,255,0.85)" />
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.76rem', margin: '2px 0 0 0' }}>
            Owner Administrator Portal
          </p>
        </div>

        <button
          onClick={onLogout}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.15s ease',
          }}
          title="Logout"
        >
          <LogOut size={14} />
          <span>Exit</span>
        </button>
      </div>

      {/* ── Module Groups ─────────────────────────────────────────────────────── */}
      {MODULE_GROUPS.map((group, idx) => (
        <div key={idx}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
            paddingLeft: '4px',
          }}>
            {group.groupTitle}
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #DCEBFA',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(77, 166, 255, 0.06)',
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
                    padding: '13px 16px',
                    cursor: 'pointer',
                    borderBottom: i < group.items.length - 1 ? '1px solid #DCEBFA' : 'none',
                    transition: 'background-color 0.15s ease',
                    minHeight: '56px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#EAF5FF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  onTouchStart={(e) => { e.currentTarget.style.background = '#EAF5FF'; }}
                  onTouchEnd={(e) => { e.currentTarget.style.background = ''; }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '11px',
                    background: item.bg,
                    border: `1px solid ${item.border}`,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={19} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1F2937' }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: '0.73rem',
                      color: '#6B7280',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px',
                    }}>
                      {item.desc}
                    </div>
                  </div>

                  <ChevronRight size={17} color="#B3D4F5" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Network & Server Settings Card ────────────────────────────────────── */}
      <div>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 800,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
          paddingLeft: '4px',
        }}>
          Network & Backend Sync
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #DCEBFA',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(77, 166, 255, 0.06)',
        }}>
          <div
            onClick={() => setShowIpModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '13px 16px',
              cursor: 'pointer',
              minHeight: '56px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#EAF5FF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Wifi size={19} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1F2937' }}>
                Server Connection IP
              </div>
              <div style={{
                fontSize: '0.74rem',
                color: '#4DA6FF',
                fontFamily: 'monospace',
                marginTop: '1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {serverUrl}
              </div>
            </div>

            <span style={{
              padding: '3px 10px',
              borderRadius: '999px',
              background: '#EAF5FF',
              color: '#4DA6FF',
              fontSize: '0.72rem',
              fontWeight: 700,
              flexShrink: 0,
              border: '1px solid #DCEBFA',
            }}>
              Edit
            </span>
          </div>
        </div>
      </div>

      {/* ── Server IP Config Modal ─────────────────────────────────────────────── */}
      {showIpModal && (
        <div className="modal-overlay" onClick={() => setShowIpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', color: '#1F2937', fontWeight: 800, marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>
              📡 Configure Backend Server
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '18px', lineHeight: 1.5 }}>
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
                <div style={{ color: '#059669', fontSize: '0.82rem', fontWeight: 700 }}>
                  ✓ Server URL saved! Reloading live sync.
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
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
