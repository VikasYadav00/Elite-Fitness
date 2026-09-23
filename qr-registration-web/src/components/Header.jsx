import React from 'react';
import { Dumbbell, ShieldCheck, MapPin, Phone } from 'lucide-react';

export default function Header() {
  return (
    <header style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '24px' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 20px',
        borderRadius: '9999px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        marginBottom: '16px'
      }}>
        <Dumbbell size={22} color="#F59E0B" />
        <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.05em', color: '#F8FAFC' }}>
          ELITE <span style={{ color: '#F59E0B' }}>FITNESS</span>
        </span>
      </div>

      <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
        Instant Membership <span className="gold-gradient-text">Registration</span>
      </h1>
      <p style={{ color: '#94A3B8', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
        Join Elite Fitness in under 2 minutes. Fill in your details, choose your plan, and get your digital QR pass instantly.
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '16px',
        fontSize: '0.8rem',
        color: '#64748B'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} color="#10B981" /> 100% Secure Checkout
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={14} color="#38BDF8" /> Elite Fitness Main Facility
        </span>
      </div>
    </header>
  );
}
