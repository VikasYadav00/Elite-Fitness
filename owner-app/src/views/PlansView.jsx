import React, { useState } from 'react';
import {
  Award, Plus, Edit2, Trash2, X, Check, Star,
  Clock, IndianRupee, Sparkles, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../api';

const MOCK_PLANS = [
  { id: '1', plan_name: 'Monthly Transformation Pass', duration_months: 1, price: 999, description: 'Full gym access & general guidance for beginners.', popular: false, status: 'ACTIVE' },
  { id: '2', plan_name: 'Quarterly Beast Mode', duration_months: 3, price: 2699, description: 'Most popular! Save ₹298 + free diet chart.', popular: true, status: 'ACTIVE' },
  { id: '3', plan_name: 'Half-Yearly Elite Pass', duration_months: 6, price: 4999, description: 'Serious goals with high savings & premium shaker.', popular: false, status: 'ACTIVE' },
  { id: '4', plan_name: 'Annual Champion Membership', duration_months: 12, price: 8999, description: 'Maximum savings + 1-on-1 PT session per month.', popular: false, status: 'ACTIVE' },
];

const BLANK_PLAN = { plan_name: '', duration_months: 1, price: '', description: '', popular: false, status: 'ACTIVE' };

export default function PlansView() {
  const [plans, setPlans] = useState(MOCK_PLANS);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // null = add mode, object = edit mode
  const [formData, setFormData] = useState(BLANK_PLAN);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setEditingPlan(null);
    setFormData(BLANK_PLAN);
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData, price: Number(formData.price), duration_months: Number(formData.duration_months) };

    if (editingPlan) {
      // Update
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, ...payload } : p));
      showToast(`Plan "${payload.plan_name}" updated successfully!`);
      try { await api.put(`/membership-plans/${editingPlan.id}`, payload); } catch (_) {}
    } else {
      // Create
      const newPlan = { ...payload, id: String(Date.now()) };
      setPlans(prev => [...prev, newPlan]);
      showToast(`Plan "${payload.plan_name}" created successfully!`);
      try { await api.post('/membership-plans', payload); } catch (_) {}
    }

    setShowModal(false);
    setFormData(BLANK_PLAN);
    setEditingPlan(null);
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete "${plan.plan_name}"? This cannot be undone.`)) return;
    setDeletingId(plan.id);
    setPlans(prev => prev.filter(p => p.id !== plan.id));
    showToast(`Plan "${plan.plan_name}" deleted.`, 'danger');
    try { await api.delete(`/membership-plans/${plan.id}`); } catch (_) {}
    setDeletingId(null);
  };

  const togglePopular = (id) => {
    setPlans(prev => prev.map(p => ({ ...p, popular: p.id === id ? !p.popular : false })));
  };

  const toggleStatus = (id) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : p));
  };

  const pricePerMonth = (price, months) => Math.round(price / months);

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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Membership Plans & Pricing</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
            Add, edit, or remove membership packages. Changes reflect instantly in the member portal.
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Create New Plan
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
        {plans.map((p) => (
          <div
            key={p.id}
            className="glass-card"
            style={{
              padding: '24px',
              position: 'relative',
              opacity: p.status === 'INACTIVE' ? 0.65 : 1,
              border: p.popular ? '2px solid rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.25s ease'
            }}
          >
            {/* Popular Badge */}
            {p.popular && (
              <span style={{
                position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg,#F59E0B,#D97706)',
                color: '#000', fontSize: '0.68rem', fontWeight: 800,
                padding: '2px 14px', borderRadius: '9999px', whiteSpace: 'nowrap'
              }}>
                ⭐ MOST POPULAR
              </span>
            )}

            {/* Status toggle top-right */}
            <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.68rem', color: p.status === 'ACTIVE' ? '#10B981' : '#9CA3AF', fontWeight: 700 }}>
                {p.status}
              </span>
              <button
                onClick={() => toggleStatus(p.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: p.status === 'ACTIVE' ? '#10B981' : '#6B7280' }}
                title="Toggle active/inactive"
              >
                {p.status === 'ACTIVE' ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
            </div>

            {/* Plan Name */}
            <div style={{ paddingRight: '70px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.3 }}>{p.plan_name}</h3>
            </div>

            {/* Description */}
            <p style={{ color: '#9CA3AF', fontSize: '0.82rem', marginBottom: '16px', minHeight: '36px' }}>
              {p.description}
            </p>

            {/* Price */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>
                ₹{p.price.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '4px' }}>
                for {p.duration_months} month{p.duration_months > 1 ? 's' : ''} &nbsp;·&nbsp;
                <span style={{ color: '#10B981', fontWeight: 600 }}>
                  ≈ ₹{pricePerMonth(p.price, p.duration_months).toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
                onClick={() => togglePopular(p.id)}
              >
                <Star size={14} style={{ color: p.popular ? '#F59E0B' : '#6B7280' }} />
                {p.popular ? 'Unmark Popular' : 'Mark Popular'}
              </button>

              <button
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.8rem', padding: '8px', color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)' }}
                onClick={() => openEdit(p)}
              >
                <Edit2 size={14} /> Edit
              </button>

              <button
                style={{
                  padding: '8px 12px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#F87171', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
                }}
                onClick={() => handleDelete(p)}
                disabled={deletingId === p.id}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Add Plan Quick Card */}
        <div
          onClick={openAdd}
          style={{
            border: '2px dashed rgba(245,158,11,0.3)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            cursor: 'pointer',
            color: '#9CA3AF',
            gap: '10px',
            transition: 'all 0.2s ease',
            minHeight: '200px'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)'; e.currentTarget.style.color = '#F59E0B'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#9CA3AF'; }}
        >
          <Plus size={32} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Create New Plan</span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#F59E0B', fontWeight: 800 }}>
                {editingPlan ? '✏️ Edit Membership Plan' : '➕ Create New Plan'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Plan Title *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Summer Fitness Booster Pass"
                  value={formData.plan_name}
                  onChange={e => setFormData({ ...formData, plan_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Duration (Months) *</label>
                  <input
                    type="number" className="input-field" min={1} max={36}
                    value={formData.duration_months}
                    onChange={e => setFormData({ ...formData, duration_months: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Price (₹) *</label>
                  <input
                    type="number" className="input-field" placeholder="e.g. 3500" min={1}
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.price && formData.duration_months && (
                <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', fontSize: '0.82rem', color: '#10B981' }}>
                  ≈ ₹{pricePerMonth(Number(formData.price), Number(formData.duration_months)).toLocaleString('en-IN')} per month
                </div>
              )}

              <div>
                <label className="label">Short Description / Perks</label>
                <textarea
                  className="input-field" rows={3}
                  placeholder="Describe what members get in this plan..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#D1D5DB' }}>
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={e => setFormData({ ...formData, popular: e.target.checked })}
                    style={{ accentColor: '#F59E0B', width: '16px', height: '16px' }}
                  />
                  Mark as Most Popular
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  <Check size={18} /> {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
