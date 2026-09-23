import React from 'react';
import { Utensils, Flame, CheckCircle, Apple } from 'lucide-react';

const MEALS = [
  { time: '08:00 AM', type: 'Breakfast', title: 'Oats with Whey Protein & Almonds', macros: '450 kcal | 35g Protein | 55g Carbs' },
  { time: '11:30 AM', type: 'Mid-Morning Snack', title: 'Boiled Eggs (4 Whole) & Fruit', macros: '320 kcal | 24g Protein | 15g Carbs' },
  { time: '02:00 PM', type: 'Lunch', title: 'Grilled Chicken Breast with Brown Rice & Salad', macros: '650 kcal | 55g Protein | 60g Carbs' },
  { time: '05:30 PM', type: 'Pre-Workout Snack', title: 'Peanut Butter Sandwich & Black Coffee', macros: '380 kcal | 15g Protein | 40g Carbs' },
  { time: '09:00 PM', type: 'Dinner', title: 'Paneer / Fish Tikka with Stir Fry Veggies', macros: '500 kcal | 40g Protein | 20g Carbs' },
];

export default function DietView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px' }}>
      <div>
        <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>Nutrition & Macro Tracker</span>
        <h2 style={{ fontSize: '1.4rem' }}>High Protein Muscle Plan</h2>
        <p style={{ color: '#94A3B8', fontSize: '0.825rem' }}>Daily Goal: 2,800 kcal | 180g Protein | 250g Carbs</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {MEALS.map((meal, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="status-badge status-active">{meal.type}</span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{meal.time}</span>
            </div>

            <h4 style={{ fontSize: '1rem', color: '#F8FAFC', marginBottom: '6px' }}>{meal.title}</h4>
            <span style={{ fontSize: '0.775rem', color: '#F59E0B', fontWeight: 600 }}>{meal.macros}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
