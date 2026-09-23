import React from 'react';
import { UserCheck, Calendar, MapPin, PhoneCall, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Step2PersonalDetails({ formData, setFormData, onNext, onPrev }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UserCheck color="#F59E0B" /> Profile Details
      </h2>
      <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '24px' }}>
        Help us personalize your fitness journey with your basic demographics and emergency contact.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="label">Date of Birth</label>
            <input
              type="date"
              className="input-field"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Gender</label>
            <select
              className="input-field"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Full Residential Address</label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="House/Flat No., Street, City, Pincode"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '20px',
          marginTop: '10px'
        }}>
          <h4 style={{ color: '#FBBF24', fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={16} /> Emergency Contact
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Contact Person Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Parent / Spouse / Friend"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Contact Phone Number</label>
              <input
                type="tel"
                className="input-field"
                placeholder="Emergency Contact Phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button type="button" className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>
            <ArrowLeft size={18} /> Back
          </button>
          <button type="submit" className="btn-primary" style={{ flex: 2 }}>
            Continue to Plans <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
