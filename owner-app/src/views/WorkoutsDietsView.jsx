import React, { useState } from 'react';
import { Dumbbell, Utensils, Plus, CheckCircle2, UserCheck, X, Calendar, Share2, Info, Sparkles } from 'lucide-react';

const WEEKLY_PLAN = [
  { day: 'Monday', tag: 'Chest + Triceps', icon: '🟥', color: '#EF4444', exercises: 'Bench Press, Incline DB Press, Chest Fly, Dips, Triceps Pushdown, Overhead Extension' },
  { day: 'Tuesday', tag: 'Back + Biceps', icon: '🟦', color: '#38BDF8', exercises: 'Lat Pulldown, Barbell/Dumbbell Row, Seated Cable Row, Face Pull, Barbell Curl, Hammer Curl' },
  { day: 'Wednesday', tag: 'Legs', icon: '🟩', color: '#10B981', exercises: 'Squats, Leg Press, Romanian Deadlift, Leg Curl, Leg Extension, Calf Raises' },
  { day: 'Thursday', tag: 'Shoulders + Abs', icon: '🟨', color: '#F59E0B', exercises: 'Overhead Press, Lateral Raise, Rear Delt Fly, Front Raise, Shrugs, Crunches, Leg Raises' },
  { day: 'Friday', tag: 'Chest + Back', icon: '🟥', color: '#EF4444', exercises: 'Incline Bench, Flat DB Press, Lat Pulldown, Cable Row, Chest Fly, Straight-Arm Pulldown' },
  { day: 'Saturday', tag: 'Legs + Arms', icon: '🟪', color: '#A855F7', exercises: 'Leg Press, Lunges, Leg Curl, Calf Raises, Biceps Curl, Triceps Pushdown' },
  { day: 'Sunday', tag: 'Rest', icon: '⬜', color: '#9CA3AF', exercises: 'Recovery + light walking/stretching' },
];

const GUIDELINES = [
  { label: 'Main compound exercises', value: '3–4 sets × 6–10 reps' },
  { label: 'Isolation exercises', value: '3 sets × 10–15 reps' },
  { label: 'Abs', value: '3 sets × 12–20 reps' },
  { label: 'Rest between heavy sets', value: '1.5–3 minutes' },
  { label: 'Warm-up routine', value: '5–10 minutes + 1–2 light warm-up sets' },
];

const MOCK_WORKOUTS = [
  { id: 'w1', name: 'Hypertrophy Muscle Builder', days: 5, category: 'Advanced', exercisesCount: 18 },
  { id: 'w2', name: 'Fat Loss & Cardio Circuit', days: 4, category: 'Beginner', exercisesCount: 14 },
  { id: 'w3', name: 'Strength & Powerlifting 5x5', days: 3, category: 'Intermediate', exercisesCount: 10 },
];

const MOCK_DIETS = [
  { id: 'd1', name: 'High Protein Muscle Gain', calories: 2800, protein: '180g', carbs: '300g', fats: '70g' },
  { id: 'd2', name: 'Keto Fat Shredder', calories: 1900, protein: '150g', carbs: '30g', fats: '110g' },
  { id: 'd3', name: 'Balanced Athletic Diet', calories: 2200, protein: '140g', carbs: '220g', fats: '60g' },
];

export default function WorkoutsDietsView() {
  const [tab, setTab] = useState('WEEKLY'); // 'WEEKLY' | 'WORKOUTS' | 'DIETS'
  const [workouts, setWorkouts] = useState(MOCK_WORKOUTS);
  const [diets, setDiets] = useState(MOCK_DIETS);
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1F2937' }}>Workouts & Diet Plans</h2>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>Weekly schedule for members, custom routines, and diet templates.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            style={{
              background: tab === 'WEEKLY' ? '#EAF5FF' : '#FFFFFF',
              color: tab === 'WEEKLY' ? '#0284C7' : '#6B7280',
              borderColor: tab === 'WEEKLY' ? '#4DA6FF' : '#DCEBFA',
              fontWeight: 700
            }}
            onClick={() => setTab('WEEKLY')}
          >
            <Calendar size={16} /> Weekly Plan
          </button>
          <button
            className="btn-secondary"
            style={{
              background: tab === 'WORKOUTS' ? '#EAF5FF' : '#FFFFFF',
              color: tab === 'WORKOUTS' ? '#0284C7' : '#6B7280',
              borderColor: tab === 'WORKOUTS' ? '#4DA6FF' : '#DCEBFA',
              fontWeight: 700
            }}
            onClick={() => setTab('WORKOUTS')}
          >
            <Dumbbell size={16} /> Routines
          </button>
          <button
            className="btn-secondary"
            style={{
              background: tab === 'DIETS' ? '#EAF5FF' : '#FFFFFF',
              color: tab === 'DIETS' ? '#0284C7' : '#6B7280',
              borderColor: tab === 'DIETS' ? '#4DA6FF' : '#DCEBFA',
              fontWeight: 700
            }}
            onClick={() => setTab('DIETS')}
          >
            <Utensils size={16} /> Diet Plans
          </button>
        </div>
      </div>

      {tab === 'WEEKLY' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Header Banner */}
          <div className="glass-card" style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #EBF5FF 0%, #FFFFFF 100%)',
            border: '1px solid #DCEBFA',
            boxShadow: '0 2px 12px rgba(77, 166, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0284C7', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Sparkles size={14} /> Member Workout Protocol
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1F2937', marginTop: '4px' }}>
                Weekly Workout Plan
              </h3>
              <p style={{ color: '#6B7280', fontSize: '0.82rem', marginTop: '2px' }}>
                Standard routine published to member apps & gym workout boards.
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 16px', gap: '6px' }}
              onClick={() => alert('Weekly Workout Plan broadcasted to all active members!')}
            >
              <Share2 size={15} /> Broadcast to Members
            </button>
          </div>

          {/* Weekly Schedule Table / Cards */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCEBFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FBFF' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1F2937' }}>📅 7-Day Training Split</span>
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, background: '#ECFDF5', padding: '3px 10px', borderRadius: '999px', border: '1px solid #A7F3D0' }}>6 Training Days • 1 Rest Day</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>DAY</th>
                    <th style={{ width: '180px' }}>WORKOUT</th>
                    <th>MAIN EXERCISES</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKLY_PLAN.map((item) => (
                    <tr key={item.day} style={{ borderBottom: '1px solid #DCEBFA' }}>
                      <td style={{ fontWeight: 800, color: '#1F2937', fontSize: '0.92rem' }}>
                        {item.day}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          background: `${item.color}15`,
                          color: item.color,
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          border: `1px solid ${item.color}30`
                        }}>
                          <span>{item.icon}</span>
                          <span>{item.tag}</span>
                        </span>
                      </td>
                      <td style={{ color: '#4B5563', fontSize: '0.86rem', lineHeight: 1.5 }}>
                        {item.exercises}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sets & Reps Guidelines Card */}
          <div className="glass-card" style={{ padding: '22px', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Info size={18} color="#0284C7" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1F2937', margin: 0 }}>
                Sets & Reps Training Guidelines
              </h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {GUIDELINES.map((g, idx) => (
                <div key={idx} style={{
                  background: '#F8FBFF',
                  border: '1px solid #DCEBFA',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    {g.label}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284C7' }}>
                    {g.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === 'WORKOUTS' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {workouts.map((w) => (
            <div key={w.id} className="glass-card" style={{ padding: '24px', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="status-badge status-active">{w.category}</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{w.days} Days / Week</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#1F2937', marginBottom: '8px', fontWeight: 800 }}>{w.name}</h3>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '16px' }}>Includes {w.exercisesCount} structured exercise routines.</p>
              <button className="btn-primary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => setShowAssignModal(true)}>
                <UserCheck size={16} /> Assign to Member
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {diets.map((d) => (
            <div key={d.id} className="glass-card" style={{ padding: '24px', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#1F2937', marginBottom: '12px', fontWeight: 800 }}>{d.name}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', background: '#F8FBFF', border: '1px solid #DCEBFA', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'center' }}>
                <div>
                  <span style={{ color: '#6B7280', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>CALORIES</span>
                  <strong style={{ color: '#D97706', fontSize: '0.95rem' }}>{d.calories}</strong>
                </div>
                <div>
                  <span style={{ color: '#6B7280', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>PROTEIN</span>
                  <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{d.protein}</strong>
                </div>
                <div>
                  <span style={{ color: '#6B7280', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>CARBS</span>
                  <strong style={{ color: '#0284C7', fontSize: '0.95rem' }}>{d.carbs}</strong>
                </div>
                <div>
                  <span style={{ color: '#6B7280', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>FATS</span>
                  <strong style={{ color: '#DC2626', fontSize: '0.95rem' }}>{d.fats}</strong>
                </div>
              </div>
              <button className="btn-primary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => setShowAssignModal(true)}>
                <UserCheck size={16} /> Assign to Member
              </button>
            </div>
          ))}
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#1F2937', fontWeight: 800 }}>Assign Plan to Member</h3>
              <X size={20} color="#6B7280" style={{ cursor: 'pointer' }} onClick={() => setShowAssignModal(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Select Member</label>
                <select className="input-field">
                  <option value="1">Rahul Sharma (EF26091001)</option>
                  <option value="2">Priya Verma (EF26091002)</option>
                  <option value="5">Vikram Singh (EF26091005)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={() => { alert('Plan assigned successfully!'); setShowAssignModal(false); }} style={{ flex: 1 }}>
                  Assign Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
