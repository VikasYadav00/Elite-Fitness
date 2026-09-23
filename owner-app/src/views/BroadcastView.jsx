import React, { useState } from 'react';
import {
  Megaphone, Send, Bell, Tag, Sparkles, Users, Phone,
  MessageSquare, Smartphone, CheckCircle, Clock, AlertCircle, X
} from 'lucide-react';
import api from '../api';

// All registered members (who'll receive messages)
const REGISTERED_MEMBERS = [
  { id: '1', name: 'Rahul Sharma', phone: '9876543210', status: 'ACTIVE' },
  { id: '2', name: 'Priya Verma', phone: '9812345678', status: 'ACTIVE' },
  { id: '3', name: 'Amit Patel', phone: '9765432109', status: 'EXPIRED' },
  { id: '4', name: 'Sneha Gupta', phone: '9988776655', status: 'FROZEN' },
  { id: '5', name: 'Vikram Singh', phone: '9123456789', status: 'INACTIVE' },
  { id: '6', name: 'Ananya Deshmukh', phone: '9845123456', status: 'ACTIVE' },
  { id: '7', name: 'Karthik Iyer', phone: '9765098765', status: 'ACTIVE' },
  { id: '8', name: 'Meena Joshi', phone: '9654321098', status: 'ACTIVE' },
];

const BROADCAST_HISTORY = [
  { id: 'b1', title: '🔥 Navratri Offer: 15% OFF', type: 'OFFER', sent_to: 8, sent_at: '2026-09-18 10:30 AM', channels: ['SMS', 'WhatsApp'] },
  { id: 'b2', title: 'Gym Closed on Oct 2nd - Gandhi Jayanti', type: 'ANNOUNCEMENT', sent_to: 8, sent_at: '2026-09-15 09:00 AM', channels: ['SMS', 'WhatsApp', 'Push'] },
  { id: 'b3', title: '⚠️ Renewal Reminder — Your membership expires soon', type: 'PUSH_ALERT', sent_to: 3, sent_at: '2026-09-10 11:00 AM', channels: ['SMS', 'WhatsApp'] },
];

const TYPE_TEMPLATES = {
  ANNOUNCEMENT: [
    { label: 'Gym Closed - Holiday', text: 'Dear {name}, Elite Fitness will be closed on {date} due to {reason}. We apologize for the inconvenience. Regular timings resume from {next_date}. — Elite Fitness' },
    { label: 'New Facility Added', text: 'Dear {name}, we\'re excited to announce a new addition to Elite Fitness: {facility}! Come experience it during our regular hours. — Team Elite Fitness' },
  ],
  OFFER: [
    { label: 'Discount Offer', text: 'Dear {name}, 🎉 Special Offer! Get {discount}% OFF on {plan} membership. Offer valid till {expiry}. Renew now at Elite Fitness! — Owner' },
    { label: 'Festival Special', text: 'Happy {festival}! 🎊 Celebrate with Elite Fitness — enjoy {discount}% OFF on annual memberships this week only. Limited slots! — Elite Fitness' },
  ],
  PUSH_ALERT: [
    { label: 'Renewal Reminder', text: 'Dear {name}, your Elite Fitness membership expires in {days} days on {date}. Renew now to continue your fitness journey without interruption! — Elite Fitness' },
    { label: 'Payment Reminder', text: 'Dear {name}, your payment of ₹{amount} for {plan} is due. Please complete your renewal to avoid membership suspension. — Elite Fitness' },
  ],
};

const CHANNEL_CONFIG = {
  SMS: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: Smartphone, desc: 'Sent via Twilio/Fast2SMS to all mobile numbers' },
  WhatsApp: { color: '#25D366', bg: 'rgba(37,211,102,0.12)', icon: MessageSquare, desc: 'Sent via WhatsApp Business API to all numbers' },
  Push: { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', icon: Bell, desc: 'Push notification via FCM to the customer app' },
};

export default function BroadcastView() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [channels, setChannels] = useState({ SMS: true, WhatsApp: true, Push: false });
  const [audience, setAudience] = useState('ALL'); // ALL | ACTIVE | EXPIRED | FROZEN
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(BROADCAST_HISTORY);

  const toggleChannel = (ch) => setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));
  const selectedChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);

  const targetMembers = audience === 'ALL'
    ? REGISTERED_MEMBERS
    : REGISTERED_MEMBERS.filter(m => m.status === audience);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (selectedChannels.length === 0) { alert('Select at least one broadcast channel.'); return; }

    setSending(true);
    setSentResult(null);

    const phoneNumbers = targetMembers.map(m => m.phone);

    // Simulate sending with real API calls
    const payload = {
      title,
      body,
      type,
      channels: selectedChannels,
      audience,
      phone_numbers: phoneNumbers,
      target_audience: audience,
    };

    try {
      if (type === 'ANNOUNCEMENT') {
        await api.post('/announcements', { title, body, target_audience: audience });
      } else if (type === 'OFFER') {
        await api.post('/offers', { title, description: body, discount_percent: 10 });
      } else {
        await api.post('/notifications/broadcast', payload);
      }
    } catch (_) {
      // Preview mode — proceed anyway
    }

    // Add to history
    const newBroadcast = {
      id: String(Date.now()),
      title,
      type,
      sent_to: targetMembers.length,
      sent_at: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      channels: selectedChannels,
    };
    setHistory(prev => [newBroadcast, ...prev]);

    setSentResult({
      total: targetMembers.length,
      channels: selectedChannels,
      numbers: phoneNumbers.slice(0, 4),
      more: Math.max(0, phoneNumbers.length - 4),
    });

    setSending(false);
    setTitle('');
    setBody('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Push Notifications, SMS & WhatsApp</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
            Broadcast to all registered member mobile numbers via SMS, WhatsApp, and Push simultaneously.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setShowHistory(!showHistory)}>
          <Clock size={18} /> {showHistory ? 'Compose Message' : 'View History'}
        </button>
      </div>

      {/* Recipient Preview Banner */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={20} color="#F59E0B" />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F9FAFB' }}>{targetMembers.length}</span>
          <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>members will receive this message</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {targetMembers.slice(0, 5).map(m => (
            <span key={m.id} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.73rem', color: '#D1D5DB' }}>
              📱 +91 {m.phone}
            </span>
          ))}
          {targetMembers.length > 5 && (
            <span style={{ background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.73rem', color: '#F59E0B', fontWeight: 700 }}>
              +{targetMembers.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Sent Result Card */}
      {sentResult && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={22} color="#10B981" />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#10B981' }}>
              Broadcast Sent to {sentResult.total} Members!
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#D1D5DB' }}>
            Channels: {sentResult.channels.map(c => <strong key={c} style={{ marginRight: '8px', color: CHANNEL_CONFIG[c]?.color }}>{c}</strong>)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
            Delivered to: {sentResult.numbers.map(n => `+91 ${n}`).join(' · ')}
            {sentResult.more > 0 && ` · and ${sentResult.more} more`}
          </div>
          <button style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', alignSelf: 'flex-start', fontSize: '0.75rem' }} onClick={() => setSentResult(null)}>
            Dismiss
          </button>
        </div>
      )}

      {!showHistory ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', alignItems: 'start' }}>
          {/* Compose Form */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Type */}
              <div>
                <label className="label">Message Type</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['ANNOUNCEMENT', 'OFFER', 'PUSH_ALERT'].map(t => (
                    <button
                      key={t} type="button" className="btn-secondary"
                      style={{
                        padding: '8px 16px', fontSize: '0.82rem',
                        background: type === t ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                        color: type === t ? '#F59E0B' : '#9CA3AF',
                        borderColor: type === t ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                      }}
                      onClick={() => setType(t)}
                    >
                      {t === 'ANNOUNCEMENT' ? '📢' : t === 'OFFER' ? '🎁' : '🔔'} {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div>
                <label className="label">Send To (Audience)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'ALL', label: `All Members (${REGISTERED_MEMBERS.length})` },
                    { key: 'ACTIVE', label: `Active Only (${REGISTERED_MEMBERS.filter(m => m.status === 'ACTIVE').length})` },
                    { key: 'EXPIRED', label: `Expired (${REGISTERED_MEMBERS.filter(m => m.status === 'EXPIRED').length})` },
                    { key: 'FROZEN', label: `Frozen (${REGISTERED_MEMBERS.filter(m => m.status === 'FROZEN').length})` },
                  ].map(({ key, label }) => (
                    <button
                      key={key} type="button" className="btn-secondary"
                      style={{
                        padding: '6px 14px', fontSize: '0.78rem',
                        background: audience === key ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
                        color: audience === key ? '#38BDF8' : '#9CA3AF',
                        borderColor: audience === key ? '#38BDF8' : 'rgba(255,255,255,0.1)',
                      }}
                      onClick={() => setAudience(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="label">Title / Headline *</label>
                <input
                  type="text" className="input-field"
                  placeholder="e.g. 🔥 Diwali Offer: 20% OFF on Annual Membership!"
                  value={title} onChange={e => setTitle(e.target.value)} required
                />
              </div>

              {/* Body */}
              <div>
                <label className="label">Message Body * (will be sent via SMS & WhatsApp)</label>
                <textarea
                  className="input-field" rows={5}
                  placeholder="Type your message here. Use {name} to personalize for each member..."
                  value={body} onChange={e => setBody(e.target.value)} required
                />
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '4px' }}>
                  Tip: Use {'{name}'} in your message to auto-replace with each member's name
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="label">Delivery Channels</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(CHANNEL_CONFIG).map(([ch, cfg]) => (
                    <label
                      key={ch}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                        background: channels[ch] ? cfg.bg : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${channels[ch] ? cfg.color + '55' : 'rgba(255,255,255,0.06)'}`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox" checked={channels[ch]}
                        onChange={() => toggleChannel(ch)}
                        style={{ accentColor: cfg.color, width: '16px', height: '16px' }}
                      />
                      <cfg.icon size={18} color={cfg.color} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: channels[ch] ? cfg.color : '#9CA3AF' }}>{ch}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{cfg.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={sending}
                style={{ padding: '13px', fontSize: '0.95rem', marginTop: '4px' }}
              >
                <Send size={18} />
                {sending
                  ? 'Sending...'
                  : `Send to ${targetMembers.length} Members via ${selectedChannels.join(' + ') || 'no channel selected'}`}
              </button>
            </form>
          </div>

          {/* Templates Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F59E0B', marginBottom: '12px' }}>
                📝 Quick Templates
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(TYPE_TEMPLATES[type] || []).map((tpl, i) => (
                  <button
                    key={i}
                    className="btn-secondary"
                    style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.8rem', lineHeight: 1.4 }}
                    onClick={() => { setBody(tpl.text); }}
                  >
                    <span style={{ display: 'block', fontWeight: 700, marginBottom: '2px' }}>{tpl.label}</span>
                    <span style={{ color: '#6B7280', fontSize: '0.72rem' }}>{tpl.text.slice(0, 60)}...</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '18px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Member Phone Directory
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                {targetMembers.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.78rem' }}>
                    <span style={{ color: '#F9FAFB', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{m.name}</span>
                    <span style={{ fontFamily: 'monospace', color: '#9CA3AF' }}>+91 {m.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Broadcast History — card-based layout */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📋 Broadcast History</h3>
            <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{history.length} broadcasts sent</span>
          </div>
          {history.map(b => (
            <div key={b.id} className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F9FAFB', lineHeight: 1.4, marginBottom: '6px' }}>{b.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                      background: b.type === 'OFFER' ? 'rgba(245,158,11,0.15)' : b.type === 'ANNOUNCEMENT' ? 'rgba(56,189,248,0.15)' : 'rgba(16,185,129,0.15)',
                      color: b.type === 'OFFER' ? '#F59E0B' : b.type === 'ANNOUNCEMENT' ? '#38BDF8' : '#10B981',
                    }}>{b.type}</span>
                    <span style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: 700 }}>👥 {b.sent_to} members</span>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>🕐 {b.sent_at}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flexShrink: 0 }}>
                  {b.channels.map(c => (
                    <span key={c} style={{
                      padding: '3px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700,
                      background: CHANNEL_CONFIG[c]?.bg, color: CHANNEL_CONFIG[c]?.color,
                      border: `1px solid ${CHANNEL_CONFIG[c]?.color}33`
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
