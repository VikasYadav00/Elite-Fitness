import React, { useState, useEffect } from 'react';
import {
  PhoneCall, AlertCircle, CheckCircle2, Clock, Filter,
  RefreshCw, Trash2, ChevronDown, User, Phone, Calendar, Tag, MessageSquare
} from 'lucide-react';
import api from '../api';
import { fetchCloudEvents, subscribeCloudStream } from '../utils/cloudSync';

const STATUS_CONFIG = {
  OPEN: { label: 'Open', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)' },
  IN_PROGRESS: { label: 'In Progress', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  RESOLVED: { label: 'Resolved', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  CLOSED: { label: 'Closed', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)', border: 'rgba(107, 114, 128, 0.3)' }
};

const CATEGORY_LABELS = {
  MEMBERSHIP: '🎫 Membership',
  PAYMENT: '💳 Payment',
  TRAINER: '🧑‍🏫 Trainer',
  WORKOUT: '💪 Workout',
  EQUIPMENT: '🏋️ Equipment',
  ATTENDANCE: '📅 Attendance',
  APP_TECHNICAL: '📱 App/Technical',
  OTHER: '💡 Other'
};

const SEED_COMPLAINTS = [
  {
    id: 'cmp-seed-1',
    name: 'Ravi Kumar',
    phone: '9812345678',
    category: 'PAYMENT',
    message: 'My payment was deducted twice for the membership renewal but only one renewal is showing in the app.',
    status: 'OPEN',
    owner_notes: '',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'cmp-seed-2',
    name: 'Priya Singh',
    phone: '9876543210',
    category: 'EQUIPMENT',
    message: 'The treadmill near the window has been making a loud noise for the past 3 days. Could you please get it checked?',
    status: 'IN_PROGRESS',
    owner_notes: 'Technician scheduled for tomorrow.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export default function ComplaintsView() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [ownerNoteInputs, setOwnerNoteInputs] = useState({});

  const loadComplaints = async () => {
    setLoading(true);
    try {
      let cloudComplaints = [];
      try {
        const cloudEvents = await fetchCloudEvents('24h');
        cloudComplaints = cloudEvents
          .filter(e => e.event === 'COMPLAINT_SUBMITTED' && e.data)
          .map(e => e.data);
      } catch (_) {}

      let backendComplaints = [];
      try {
        const res = await api.get('/complaints');
        const data = res.data?.data || res.data || [];
        backendComplaints = Array.isArray(data) ? data : [];
      } catch (_) {}

      setComplaints(prev => {
        const map = new Map();
        SEED_COMPLAINTS.forEach(c => map.set(c.id, c));
        prev.forEach(c => map.set(c.id, c));
        backendComplaints.forEach(c => map.set(c.id, c));
        cloudComplaints.forEach(c => map.set(c.id, c));
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
      });
    } catch (_) {
      setComplaints(SEED_COMPLAINTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();

    const unsubscribe = subscribeCloudStream((msg) => {
      if (msg.event === 'COMPLAINT_SUBMITTED' && msg.data) {
        const newCmp = msg.data;
        setComplaints(prev => {
          if (prev.some(c => c.id === newCmp.id)) return prev;
          return [newCmp, ...prev];
        });
      }
    });

    const pollInterval = setInterval(loadComplaints, 15000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/complaints/${id}/status`, {
        status,
        owner_notes: ownerNoteInputs[id] || undefined
      });
      setComplaints(prev => prev.map(c =>
        c.id === id ? {
          ...c, status,
          owner_notes: ownerNoteInputs[id] ?? c.owner_notes,
          updated_at: new Date().toISOString()
        } : c
      ));
    } catch (_) {
      // Update in-memory even if API fails
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await api.delete(`/complaints/${id}`);
    } catch (_) {}
    setComplaints(prev => prev.filter(c => c.id !== id));
  };

  const filtered = filter === 'ALL'
    ? complaints
    : complaints.filter(c => c.status === filter);

  const counts = {
    ALL: complaints.length,
    OPEN: complaints.filter(c => c.status === 'OPEN').length,
    IN_PROGRESS: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    RESOLVED: complaints.filter(c => c.status === 'RESOLVED').length,
    CLOSED: complaints.filter(c => c.status === 'CLOSED').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={18} color="#38BDF8" />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F9FAFB' }}>Complaints & Support</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
            Submitted via Universal QR
          </div>
        </div>
        <button
          onClick={loadComplaints}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.78rem'
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div
            key={status}
            onClick={() => setFilter(status)}
            style={{
              minWidth: '90px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: filter === status ? cfg.bg : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === status ? cfg.border : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: cfg.color }}>{counts[status] || 0}</div>
            <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 700 }}>{cfg.label}</div>
          </div>
        ))}
        <div
          onClick={() => setFilter('ALL')}
          style={{
            minWidth: '70px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: filter === 'ALL' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${filter === 'ALL' ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F59E0B' }}>{counts.ALL}</div>
          <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 700 }}>All</div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '0.85rem' }}>
          Loading complaints...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'rgba(17, 24, 39, 0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          color: '#6B7280',
          fontSize: '0.88rem'
        }}>
          <PhoneCall size={32} color="#374151" style={{ marginBottom: '12px' }} />
          <div>No {filter !== 'ALL' ? STATUS_CONFIG[filter]?.label.toLowerCase() : ''} complaints found.</div>
        </div>
      )}

      {/* Complaint Cards */}
      {!loading && filtered.map(complaint => {
        const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.OPEN;
        const isExpanded = expandedId === complaint.id;
        const catLabel = CATEGORY_LABELS[complaint.category] || complaint.category;

        return (
          <div
            key={complaint.id}
            style={{
              background: 'rgba(17, 24, 39, 0.9)',
              border: `1px solid ${isExpanded ? statusCfg.border : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '16px',
              overflow: 'hidden',
              transition: 'border-color 0.2s'
            }}
          >
            {/* Card Header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                minWidth: '40px',
                borderRadius: '10px',
                background: statusCfg.bg,
                border: `1px solid ${statusCfg.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}>
                {catLabel.split(' ')[0]}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F9FAFB' }}>
                    {complaint.name || 'Anonymous'}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: statusCfg.bg,
                    border: `1px solid ${statusCfg.border}`,
                    color: statusCfg.color,
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}>
                    {statusCfg.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '2px' }}>
                  {catLabel} · {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{
                  fontSize: '0.82rem',
                  color: '#D1D5DB',
                  marginTop: '6px',
                  display: '-webkit-box',
                  WebkitLineClamp: isExpanded ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: isExpanded ? 'visible' : 'hidden',
                  lineHeight: 1.5
                }}>
                  {complaint.message}
                </div>
              </div>

              <ChevronDown
                size={18}
                color="#6B7280"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', minWidth: '18px' }}
              />
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Contact info */}
                {complaint.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#9CA3AF' }}>
                    <Phone size={14} color="#10B981" />
                    <a href={`tel:${complaint.phone}`} style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>{complaint.phone}</a>
                  </div>
                )}

                {/* Owner notes */}
                {complaint.owner_notes && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    color: '#F59E0B'
                  }}>
                    📝 Owner Note: {complaint.owner_notes}
                  </div>
                )}

                {/* Add/Edit owner note */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6B7280', marginBottom: '4px' }}>
                    Owner Note (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={ownerNoteInputs[complaint.id] ?? complaint.owner_notes ?? ''}
                    onChange={e => setOwnerNoteInputs(prev => ({ ...prev, [complaint.id]: e.target.value }))}
                    placeholder="Add internal note..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#F9FAFB',
                      fontSize: '0.8rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Status Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                    complaint.status !== status && (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(complaint.id, status)}
                        disabled={updatingId === complaint.id}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${cfg.border}`,
                          background: cfg.bg,
                          color: cfg.color,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Mark {cfg.label}
                      </button>
                    )
                  ))}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(complaint.id)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#F87171',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
