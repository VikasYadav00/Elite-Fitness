import React, { useState } from 'react';
import { Dumbbell, CheckCircle2, Play, Timer, Flame } from 'lucide-react';

const MOCK_EXERCISES = [
  { id: '1', name: 'Barbell Bench Press', sets: 4, reps: '8 - 12', rest: '90s', target: 'Chest' },
  { id: '2', name: 'Incline Dumbbell Press', sets: 3, reps: '10 - 12', rest: '60s', target: 'Upper Chest' },
  { id: '3', name: 'Cable Chest Flyes', sets: 4, reps: '12 - 15', rest: '60s', target: 'Inner Chest' },
  { id: '4', name: 'Triceps Rope Pushdowns', sets: 4, reps: '12 - 15', rest: '45s', target: 'Triceps Lateral Head' },
  { id: '5', name: 'Skullcrushers (EZ Bar)', sets: 3, reps: '10 - 12', rest: '60s', target: 'Triceps Long Head' },
];

export default function WorkoutView() {
  const [completed, setCompleted] = useState({});

  const toggleComplete = (id) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const countDone = Object.values(completed).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px' }}>
      <div>
        <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>Day 1 Routine</span>
        <h2 style={{ fontSize: '1.4rem' }}>Chest & Triceps Hypertrophy</h2>
        <p style={{ color: '#94A3B8', fontSize: '0.825rem' }}>{countDone} of {MOCK_EXERCISES.length} exercises completed</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {MOCK_EXERCISES.map((ex) => {
          const isDone = completed[ex.id];

          return (
            <div
              key={ex.id}
              className="glass-card"
              style={{
                padding: '18px',
                borderColor: isDone ? '#10B981' : 'rgba(245, 158, 11, 0.2)',
                background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(18, 26, 43, 0.88)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#F8FAFC' }}>{ex.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{ex.target}</span>
                </div>

                <button
                  onClick={() => toggleComplete(ex.id)}
                  style={{
                    background: isDone ? '#10B981' : 'rgba(255,255,255,0.06)',
                    color: isDone ? '#000' : '#94A3B8',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={16} /> {isDone ? 'Done' : 'Mark Done'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                <div><strong>Sets:</strong> {ex.sets}</div>
                <div><strong>Reps:</strong> {ex.reps}</div>
                <div><strong>Rest:</strong> {ex.rest}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
