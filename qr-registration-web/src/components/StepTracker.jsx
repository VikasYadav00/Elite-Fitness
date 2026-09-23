import React from 'react';
import { Check } from 'lucide-react';

export default function StepTracker({ currentStep, steps }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '36px',
      position: 'relative',
      padding: '0 10px'
    }}>
      {/* Background progress line */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '40px',
        right: '40px',
        height: '3px',
        background: 'rgba(255, 255, 255, 0.1)',
        zIndex: 0
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #F59E0B, #38BDF8)',
          width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          transition: 'width 0.4s ease'
        }} />
      </div>

      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={idx} style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: isDone
                ? '#10B981'
                : isCurrent
                ? '#F59E0B'
                : '#1E293B',
              color: isDone || isCurrent ? '#000' : '#94A3B8',
              border: isCurrent ? '3px solid rgba(245, 158, 11, 0.3)' : 'none',
              boxShadow: isCurrent ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {isDone ? <Check size={20} color="#000" /> : stepNum}
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: isCurrent ? 700 : 500,
              color: isCurrent ? '#F8FAFC' : isDone ? '#10B981' : '#64748B',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
