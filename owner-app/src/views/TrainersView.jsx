import React, { useState } from 'react';
import {
  UserCheck, Plus, Phone, Mail, Award, X, Edit2,
  Trash2, Star, Users, Briefcase, Check, Sparkles
} from 'lucide-react';
import api from '../api';

const MOCK_TRAINERS = [
  { id: '1', name: 'Vikram Rajput', phone: '9876500112', email: 'vikram.t@elitefitness.com', specialization: 'Bodybuilding & Powerlifting', experience: '6 Years', bio: 'Ex-national powerlifter with a passion for strength training.', assigned: 24, status: 'ACTIVE' },
  { id: '2', name: 'Ananya Roy', phone: '9876500113', email: 'ananya.t@elitefitness.com', specialization: 'CrossFit & Functional Training', experience: '4 Years', bio: 'Certified CrossFit Level-2 coach focused on endurance and mobility.', assigned: 18, status: 'ACTIVE' },
  { id: '3', name: 'Karan Mehra', phone: '9876500114', email: 'karan.t@elitefitness.com', specialization: 'Weight Loss & Transformation', experience: '5 Years', bio: 'Specializes in body recomposition and metabolic conditioning.', assigned: 21, status: 'ACTIVE' },
];

const BLANK_TRAINER = { name: '', phone: '', email: '', specialization: '', experience: '', bio: '', status: 'ACTIVE' };

const SPECIALIZATIONS = [
  'Bodybuilding & Powerlifting',
  'Weight Loss & Transformation',
  'CrossFit & Functional Training',
  'Yoga & Flexibility',
  'Cardio & Endurance',
  'Zumba & Dance Fitness',
  'Sports Performance',
  'Rehabilitation & Injury Prevention',
];

export default function TrainersView() {
  const [trainers, setTrainers] = useState(MOCK_TRAINERS);
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [formData, setFormData] = useState(BLANK_TRAINER);
  const [viewTrainer, setViewTrainer] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setEditingTrainer(null);
    setFormData(BLANK_TRAINER);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditingTrainer(t);
    setFormData({ ...t });
    setViewTrainer(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (editingTrainer) {
      setTrainers(prev => prev.map(t => t.id === editingTrainer.id ? { ...t, ...formData } : t));
      showToast(`Trainer "${formData.name}" updated successfully!`);
      try { await api.put(`/trainers/${editingTrainer.id}`, formData); } catch (_) {}
    } else {
      const newT = { ...formData, id: String(Date.now()), assigned: 0 };
      setTrainers(prev => [...prev, newT]);
      showToast(`Trainer "${formData.name}" added successfully!`);
      try { await api.post('/trainers', formData); } catch (_) {}
    }

    setShowModal(false);
    setFormData(BLANK_TRAINER);
    setEditingTrainer(null);
  };

  const handleDelete = async (trainer) => {
    if (!window.confirm(`Remove trainer "${trainer.name}" from Elite Fitness?`)) return;
    setTrainers(prev => prev.filter(t => t.id !== trainer.id));
    setViewTrainer(null);
    showToast(`Trainer "${trainer.name}" removed.`, 'danger');
    try { await api.delete(`/trainers/${trainer.id}`); } catch (_) {}
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const AVATAR_COLORS = ['#F59E0B', '#38BDF8', '#10B981', '#A78BFA', '#FB923C'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'linear-gradient(135deg,#1E293B,#0F172A)',
          border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: '#F9FAFB', padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem'
        }}>
          <Sparkles size={18} color={toast.type === 'success' ? '#10B981' : '#EF4444'} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gym Trainers & Instructors</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
            View, add, edit, or remove trainer profiles. Click a card to view full details.
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add New Trainer
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={22} color="#F59E0B" />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Total Trainers</div>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#F9FAFB' }}>{trainers.length}</div>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserCheck size={22} color="#10B981" />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Active Trainers</div>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#10B981' }}>{trainers.filter(t => t.status === 'ACTIVE').length}</div>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Briefcase size={22} color="#38BDF8" />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Total Assigned</div>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#38BDF8' }}>{trainers.reduce((a, t) => a + (t.assigned || 0), 0)}</div>
          </div>
        </div>
      </div>

      {/* Trainer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
        {trainers.map((t, i) => {
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <div
              key={t.id}
              className="glass-card"
              style={{
                padding: '22px', cursor: 'pointer',
                opacity: t.status === 'INACTIVE' ? 0.65 : 1,
                transition: 'all 0.25s ease'
              }}
              onClick={() => setViewTrainer(t)}
            >
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                  background: `${color}22`, border: `2px solid ${color}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, color, fontSize: '1.1rem', fontFamily: 'Outfit,sans-serif'
                }}>
                  {getInitials(t.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F9FAFB' }}>{t.name}</h3>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                    background: `${color}1A`, color, border: `1px solid ${color}44`
                  }}>
                    {t.specialization}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={13} /> {t.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Mail size={13} /> {t.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={13} color="#F59E0B" /> {t.experience} experience
                </div>
              </div>

              {/* Assigned count */}
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '14px'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Members Assigned</span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#F59E0B' }}>{t.assigned}</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: '0.8rem', padding: '8px', color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)' }}
                  onClick={() => openEdit(t)}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  style={{
                    padding: '8px 14px', background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)', color: '#F87171',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
                  }}
                  onClick={() => handleDelete(t)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Trainer Quick Card */}
        <div
          onClick={openAdd}
          style={{
            border: '2px dashed rgba(245,158,11,0.3)', borderRadius: 'var(--radius-lg)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px', cursor: 'pointer', color: '#9CA3AF', gap: '10px',
            transition: 'all 0.2s ease', minHeight: '220px'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)'; e.currentTarget.style.color = '#F59E0B'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#9CA3AF'; }}
        >
          <Plus size={32} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Add New Trainer</span>
        </div>
      </div>

      {/* View Trainer Detail Modal */}
      {viewTrainer && (
        <div className="modal-overlay" onClick={() => setViewTrainer(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#F59E0B', fontWeight: 800 }}>Trainer Profile</h3>
              <button onClick={() => setViewTrainer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}>
                {getInitials(viewTrainer.name)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#F9FAFB' }}>{viewTrainer.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#38BDF8', marginTop: '2px' }}>{viewTrainer.specialization}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              {[
                ['📞 Phone', viewTrainer.phone],
                ['✉️ Email', viewTrainer.email],
                ['⭐ Experience', viewTrainer.experience],
                ['🏋️ Members Assigned', `${viewTrainer.assigned} active members`],
                ['📝 Bio', viewTrainer.bio || 'No bio provided.'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ color: '#9CA3AF', minWidth: '120px', flexShrink: 0 }}>{label}:</span>
                  <span style={{ color: '#F9FAFB', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setViewTrainer(null); handleDelete(viewTrainer); }}>
                <Trash2 size={16} /> Delete
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => openEdit(viewTrainer)}>
                <Edit2 size={16} /> Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#F59E0B', fontWeight: 800 }}>
                {editingTrainer ? '✏️ Edit Trainer Profile' : '➕ Add New Trainer'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Full Name *</label>
                <input type="text" className="input-field" placeholder="e.g. Karan Sharma" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Phone Number *</label>
                  <input type="tel" className="input-field" placeholder="9876543210" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Experience</label>
                  <input type="text" className="input-field" placeholder="e.g. 5 Years" value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input-field" placeholder="trainer@elitefitness.com" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div>
                <label className="label">Specialization</label>
                <select className="input-field" value={formData.specialization}
                  onChange={e => setFormData({ ...formData, specialization: e.target.value })}>
                  <option value="">Select specialization...</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Short Bio</label>
                <textarea className="input-field" rows={2} placeholder="Brief trainer background..."
                  value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  <Check size={18} /> {editingTrainer ? 'Save Changes' : 'Add Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
