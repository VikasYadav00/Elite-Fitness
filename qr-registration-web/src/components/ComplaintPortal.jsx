import React, { useState, useEffect } from 'react';
import {
  PhoneCall, Send, CheckCircle2, AlertCircle,
  Dumbbell, ArrowLeft, ExternalLink, RefreshCw, User, Phone, FileText
} from 'lucide-react';
import api from '../api';
import { publishCloudEvent } from '../cloudSync';

const CATEGORIES = [
  { id: 'MEMBERSHIP', label: '🎫 Membership' },
  { id: 'PAYMENT', label: '💳 Payment' },
  { id: 'TRAINER', label: '🧑‍🏫 Trainer' },
  { id: 'WORKOUT', label: '💪 Workout' },
  { id: 'EQUIPMENT', label: '🏋️ Equipment' },
  { id: 'ATTENDANCE', label: '📅 Attendance' },
  { id: 'APP_TECHNICAL', label: '📱 App / Technical' },
  { id: 'OTHER', label: '💡 Other' }
];

export default function ComplaintPortal({ onBack, gymInfo }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);

  // Fetch public gym settings for phone/whatsapp
  useEffect(() => {
    if (gymInfo) {
      setContactInfo(gymInfo);
      return;
    }
    api.get('/settings/public')
      .then(res => {
        if (res.data?.data) setContactInfo(res.data.data);
      })
      .catch(() => {});
  }, [gymInfo]);

  const gymPhone = contactInfo?.phone || contactInfo?.whatsapp || '8953933110';
  const gymWhatsApp = contactInfo?.whatsapp || gymPhone;
  const whatsappUrl = `https://wa.me/91${gymWhatsApp.replace(/\D/g, '').replace(/^91/, '')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError('Please describe your complaint or issue.');
      return;
    }

    setSubmitting(true);
    const complaintItem = {
      id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Anonymous Member',
      phone: phone.trim(),
      category,
      message: message.trim(),
      status: 'OPEN',
      owner_notes: '',
      created_at: new Date().toISOString()
    };

    // 1. Broadcast to cloud sync (works globally on 4G/5G/Wi-Fi to Owner App)
    publishCloudEvent('COMPLAINT_SUBMITTED', complaintItem).catch(() => {});

    // 2. Also attempt local backend API
    try {
      await api.post('/complaints', {
        name: name.trim() || 'Anonymous',
        phone: phone.trim(),
        category,
        message: message.trim()
      });
    } catch (_) {}

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0B0F17 0%, #111827 50%, #0B0F17 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '24px',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle2 size={36} color="#10B981" />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F9FAFB', marginBottom: '10px' }}>
            Complaint Received!
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Your complaint has been submitted to the Elite Fitness management team.
            We will review it and get back to you as soon as possible.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                setSubmitted(false);
                setMessage('');
                setName('');
                setPhone('');
                setCategory('OTHER');
              }}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#D1D5DB',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={15} /> Submit Another
            </button>

            {onBack && (
              <button
                onClick={onBack}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#F59E0B',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={15} /> Back to Services
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0B0F17 0%, #111827 50%, #0B0F17 100%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '20px 16px 60px'
    }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '20px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
        }}>
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.8rem',
                marginBottom: '12px',
                padding: '0'
              }}
            >
              <ArrowLeft size={15} /> Back to Services
            </button>
          )}

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '999px',
            padding: '5px 14px',
            color: '#38BDF8',
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '10px'
          }}>
            <Dumbbell size={13} /> ELITE FITNESS CLUB
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F9FAFB', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            📞 Complaint & Support
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            We're here to help. Reach out through any of the options below.
          </p>
        </div>

        {/* Quick Contact Options */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Quick Contact
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Call Now */}
            <a
              href={`tel:${gymPhone}`}
              id="contact-call-now"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'}
            >
              <div style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PhoneCall size={20} color="#10B981" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F9FAFB' }}>Call Now</div>
                <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>{gymPhone}</div>
              </div>
              <ExternalLink size={16} color="#10B981" />
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              id="contact-whatsapp"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(37, 211, 102, 0.10)',
                border: '1px solid rgba(37, 211, 102, 0.28)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(37, 211, 102, 0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(37, 211, 102, 0.10)'}
            >
              <div style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '12px',
                background: 'rgba(37, 211, 102, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}>
                💬
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F9FAFB' }}>WhatsApp</div>
                <div style={{ fontSize: '0.78rem', color: '#25D366', fontWeight: 600 }}>Chat with us on WhatsApp</div>
              </div>
              <ExternalLink size={16} color="#25D366" />
            </a>
          </div>
        </div>

        {/* Complaint Form */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            📝 Submit a Complaint
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '5px', fontWeight: 600 }}>
                Your Name (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#F9FAFB',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '5px', fontWeight: 600 }}>
                Phone Number (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#F9FAFB',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '8px', fontWeight: 600 }}>
                Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '7px' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: category === cat.id ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                      background: category === cat.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: category === cat.id ? '#38BDF8' : '#9CA3AF',
                      fontSize: '0.75rem',
                      fontWeight: category === cat.id ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '5px', fontWeight: 600 }}>
                Complaint / Message <span style={{ color: '#F59E0B' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <FileText size={15} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue or complaint in detail..."
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${message.trim() ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: '#F9FAFB',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.5,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#F87171',
                fontSize: '0.82rem'
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="complaint-submit"
              disabled={submitting || !message.trim()}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                background: !message.trim()
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #38BDF8, #0284C7)',
                color: !message.trim() ? '#6B7280' : '#000',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: !message.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: !message.trim() ? 'none' : '0 6px 20px rgba(56, 189, 248, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? <>⏳ Submitting...</> : <><Send size={17} /> Submit Complaint</>}
            </button>
          </form>
        </div>

        {/* Back link */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '8px'
            }}
          >
            <ArrowLeft size={14} /> Return to Service Selection
          </button>
        )}
      </div>
    </div>
  );
}
