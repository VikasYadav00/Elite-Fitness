import React, { useState, useEffect } from 'react';
import {
  PhoneCall, AlertCircle, CheckCircle2, Clock, Filter,
  RefreshCw, Trash2, ChevronDown, User, Phone, Calendar, Tag, MessageSquare
} from 'lucide-react';
import api from '../api';
import { fetchCloudEvents, subscribeCloudStream } from '../utils/cloudSync';

const STATUS_CONFIG = {
  OPEN: { label: 'Open', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  IN_PROGRESS: { label: 'In Progress', color: '#0284C7', bg: '#EAF5FF', border: '#BAE6FD' },
  RESOLVED: { label: 'Resolved', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  CLOSED: { label: 'Closed', color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' }
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
        background: '#FFFFFF',
        border: '1px solid #DCEBFA',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(77, 166, 255, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={18} color="#4DA6FF" />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1F2937' }}>Complaints & Support</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
            Submitted via Universal QR
          </div>
        </div>
        <button
          onClick={loadComplaints}
          style={{
            background: '#F0F7FF',
            border: '1px solid #DCEBFA',
            borderRadius: '10px',
            padding: '8px 14px',
            color: '#0284C7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 600
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
              background: filter === status ? cfg.bg : '#FFFFFF',
              border: `1px solid ${filter === status ? cfg.border : '#DCEBFA'}`,
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: cfg.color }}>{counts[status] || 0}</div>
            <div style={{ fontSize: '0.68rem', color: '#6B7280', fontWeight: 700 }}>{cfg.label}</div>
          </div>
        ))}
        <div
          onClick={() => setFilter('ALL')}
          style={{
            minWidth: '70px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: filter === 'ALL' ? '#EAF5FF' : '#FFFFFF',
            border: `1px solid ${filter === 'ALL' ? '#4DA6FF' : '#DCEBFA'}`,
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4DA6FF' }}>{counts.ALL}</div>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', fontWeight: 700 }}>All</div>
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
          background: '#FFFFFF',
          border: '1px solid #DCEBFA',
          borderRadius: '16px',
          color: '#6B7280',
          fontSize: '0.88rem'
        }}>
          <PhoneCall size={32} color="#9CA3AF" style={{ marginBottom: '12px' }} />
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
              background: '#FFFFFF',
              border: `1px solid ${isExpanded ? '#4DA6FF' : '#DCEBFA'}`,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(77, 166, 255, 0.08)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
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
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1F2937' }}>
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
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                  {catLabel} · {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{
                  fontSize: '0.82rem',
                  color: '#4B5563',
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
                borderTop: '1px solid #DCEBFA',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#F8FBFF'
              }}>
                {/* Contact info */}
                {complaint.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6B7280' }}>
                    <Phone size={14} color="#059669" />
                    <a href={`tel:${complaint.phone}`} style={{ color: '#059669', textDecoration: 'none', fontWeight: 600 }}>{complaint.phone}</a>
                  </div>
                )}

                {/* Owner notes */}
                {complaint.owner_notes && (
                  <div style={{
                    padding: '10px 12px',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    color: '#92400E'
                  }}>
                    📝 Owner Note: {complaint.owner_notes}
                  </div>
                )}

                {/* Add/Edit owner note */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>
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
                      background: '#FFFFFF',
                      border: '1px solid #DCEBFA',
                      color: '#1F2937',
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
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#DC2626',
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
