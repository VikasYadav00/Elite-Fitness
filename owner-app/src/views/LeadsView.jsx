import React, { useState } from 'react';
import { Target, Plus, Phone, UserCheck, ArrowRight, X, QrCode, Star, MessageSquare, Copy, Check, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const MOCK_LEADS = [
  { id: 'l1', name: 'Manish Malhotra', phone: '9876511223', goal: 'Weight Loss', status: 'NEW', date: '2026-09-18' },
  { id: 'l2', name: 'Siddharth Rao', phone: '9811223344', goal: 'Muscle Gain', status: 'TRIAL', date: '2026-09-17' },
  { id: 'l3', name: 'Kavita Joshi', phone: '9766554433', goal: 'General Fitness', status: 'CONTACTED', date: '2026-09-16' },
];

const MOCK_FEEDBACKS = [
  { id: 'fb1', name: 'Rahul Sharma', rating: 5, date: 'Today, 08:30 AM', comment: 'World class equipment and super clean workout area! Loving the energy.' },
  { id: 'fb2', name: 'Priya Verma', rating: 5, date: 'Yesterday', comment: 'Trainers are very encouraging and attentive. Great community atmosphere.' },
  { id: 'fb3', name: 'Vikram Singh', rating: 4, date: '20 Sep 2026', comment: 'Solid gym! Could use an extra squat rack during peak evening hours.' }
];

export default function LeadsView() {
  const [leads, setLeads] = useState(MOCK_LEADS);
  const [feedbacks, setFeedbacks] = useState(MOCK_FEEDBACKS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', goal: 'Weight Loss' });
  const [copied, setCopied] = useState(false);

  const feedbackUrl = (typeof window !== 'undefined' && localStorage.getItem('ef_feedback_qr_url') && !localStorage.getItem('ef_feedback_qr_url').includes('192.168.'))
    ? localStorage.getItem('ef_feedback_qr_url')
    : 'https://vikasyadav00.github.io/Elite-Fitness/?feedback=1';

  const handleCopyFeedbackLink = () => {
    navigator.clipboard.writeText(feedbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddLead = (e) => {
    e.preventDefault();
    setLeads([{ id: String(Date.now()), ...newLead, status: 'NEW', date: new Date().toISOString().split('T')[0] }, ...leads]);
    setShowAddModal(false);
    setNewLead({ name: '', phone: '', goal: 'Weight Loss' });
  };

  const handleConvert = (id) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: 'JOINED' } : l));
    alert('Lead converted to active member!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Leads CRM & Customer Feedback</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Track new gym enquiries and collect customer feedback via QR.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add New Lead
        </button>
      </div>

      {/* Customer Feedback QR Code Showcase Card */}
      <div className="glass-card" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.85))',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* QR Code Stand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: '#FFFFFF',
            padding: '16px',
            borderRadius: '20px',
            boxShadow: '0 12px 36px rgba(245, 158, 11, 0.2), 0 0 0 3px rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <QRCodeSVG
              value={feedbackUrl}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <button
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            onClick={handleCopyFeedbackLink}
          >
            {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            {copied ? 'Link Copied' : 'Copy Feedback Link'}
          </button>
        </div>

        {/* QR Description & Rating Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            width: 'fit-content',
            fontSize: '0.75rem',
            fontWeight: 800
          }}>
            <QrCode size={14} /> CUSTOMER REVIEW & FEEDBACK QR
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F9FAFB' }}>
            Customer Feedback & Reviews
          </h3>

          <p style={{ color: '#D1D5DB', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Place this QR at gym reception, water stations, or locker rooms. Members and trial visitors can scan to share their gym experience and rating.
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '4px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Star size={24} color="#F59E0B" fill="#F59E0B" />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F9FAFB' }}>4.9 / 5.0</div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Gym Satisfaction</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MessageSquare size={22} color="#10B981" />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>128</div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Feedbacks Received</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Feedbacks List */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#F9FAFB', marginBottom: '14px' }}>
          💬 Recent Member Feedback & Reviews
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {feedbacks.map(f => (
            <div key={f.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F9FAFB' }}>{f.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(f.rating)].map((_, i) => (
                      <Star key={i} size={13} color="#F59E0B" fill="#F59E0B" />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#9CA3AF', marginLeft: '6px' }}>{f.date}</span>
                </div>
              </div>
              <div style={{ color: '#D1D5DB', fontSize: '0.84rem', lineHeight: 1.4 }}>
                "{f.comment}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>🎯 Active Leads & Enquiries</h3>
          <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{leads.length} active leads</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>LEAD NAME</th>
                <th>PHONE</th>
                <th>FITNESS GOAL</th>
                <th>ENQUIRY DATE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.name}</td>
                  <td>{l.phone}</td>
                  <td>{l.goal}</td>
                  <td>{l.date}</td>
                  <td>
                    <span className={`status-badge ${l.status === 'JOINED' ? 'status-active' : 'status-frozen'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    {l.status !== 'JOINED' && (
                      <button
                        className="btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => handleConvert(l.id)}
                      >
                        Convert to Member <ArrowRight size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#F59E0B' }}>Add New Enquiry Lead</h3>
              <X size={20} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Lead Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Ramesh Kumar"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="9876543210"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Primary Fitness Goal</label>
                <select
                  className="input-field"
                  value={newLead.goal}
                  onChange={(e) => setNewLead({ ...newLead, goal: e.target.value })}
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Gain">Muscle Gain</option>
                  <option value="Bodybuilding">Bodybuilding</option>
                  <option value="General Fitness">General Fitness</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
