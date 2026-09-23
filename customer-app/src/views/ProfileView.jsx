import React, { useState } from 'react';
import { User, Phone, Mail, Award, Clock, FileText, ShieldCheck, LogOut, ChevronRight } from 'lucide-react';

export default function ProfileView() {
  const member = {
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    reg_id: 'EF26091001',
    joining_date: '15 Sep 2026',
    emergency_contact: 'Sunil Sharma (Father) - 9876500999',
    weight: '76 kg',
    height: '178 cm',
    bmi: '24.0 (Normal)'
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    alert('Logged out successfully');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px' }}>
      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', fontWeight: 800, fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {member.name[0]}
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#F8FAFC' }}>{member.name}</h3>
          <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontFamily: 'monospace', fontWeight: 700 }}>{member.reg_id}</span>
        </div>
      </div>

      {/* Body Stats */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#F59E0B', textTransform: 'uppercase', marginBottom: '14px' }}>Physical Measurements</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', fontSize: '0.825rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '10px' }}>
            <span style={{ color: '#94A3B8', display: 'block' }}>WEIGHT</span>
            <strong style={{ color: '#F8FAFC', fontSize: '1rem' }}>{member.weight}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '10px' }}>
            <span style={{ color: '#94A3B8', display: 'block' }}>HEIGHT</span>
            <strong style={{ color: '#F8FAFC', fontSize: '1rem' }}>{member.height}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '10px' }}>
            <span style={{ color: '#94A3B8', display: 'block' }}>BMI SCORE</span>
            <strong style={{ color: '#10B981', fontSize: '1rem' }}>{member.bmi}</strong>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#F59E0B', textTransform: 'uppercase' }}>Contact & Emergency</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#CBD5E1' }}>
          <Phone size={16} color="#94A3B8" /> {member.phone}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#CBD5E1' }}>
          <Mail size={16} color="#94A3B8" /> {member.email}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#CBD5E1' }}>
          <ShieldCheck size={16} color="#10B981" /> Emergency: {member.emergency_contact}
        </div>
      </div>

      <button className="btn-secondary" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={handleLogout}>
        <LogOut size={16} /> Logout from App
      </button>
    </div>
  );
}
