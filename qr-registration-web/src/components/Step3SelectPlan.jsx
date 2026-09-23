import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import api from '../api';

const DEFAULT_PLANS = [
  {
    id: '1',
    plan_name: 'Monthly Transformation Pass',
    duration_months: 1,
    price: '2500',
    description: 'Perfect for getting started with full gym access and trainer guidance.',
    features: ['Full Gym & Cardio Access', 'General Trainer Support', 'Locker Facility', 'Free Body Composition Test'],
    popular: false
  },
  {
    id: '2',
    plan_name: 'Quarterly Beast Mode',
    duration_months: 3,
    price: '6500',
    description: 'Our most popular plan! Build consistency and save ₹1,000.',
    features: ['Full Gym & Heavy Lift Area', 'Personalized Diet Chart', 'Locker & Steam Bath Access', 'Free Consultation with Senior Coach'],
    popular: true
  },
  {
    id: '3',
    plan_name: 'Half-Yearly Elite Pass',
    duration_months: 6,
    price: '11500',
    description: 'Serious fitness commitments with huge savings and VIP perks.',
    features: ['Unrestricted 24/7 Access', 'Custom Workout Routine Builder', 'Quarterly Progress Reviews', 'Complimentary Elite Fitness Shaker'],
    popular: false
  },
  {
    id: '4',
    plan_name: 'Annual Champion Membership',
    duration_months: 12,
    price: '19999',
    description: 'Ultimate 1-year transformation pass with maximum savings!',
    features: ['All VIP Gym Amenities Included', '1-on-1 Personal Training Session', 'Unlimited Sauna & Recovery Zone', 'Freeze Membership up to 30 Days Free'],
    popular: false
  }
];

export default function Step3SelectPlan({ selectedPlan, setSelectedPlan, onNext, onPrev }) {
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true);
        const res = await api.get('/membership-plans');
        if (res.data?.data && res.data.data.length > 0) {
          setPlans(res.data.data);
        }
      } catch (err) {
        console.log('Using default plans preview');
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  // Set default plan if none selected
  useEffect(() => {
    if (!selectedPlan && plans.length > 0) {
      setSelectedPlan(plans.find(p => p.popular) || plans[0]);
    }
  }, [plans, selectedPlan, setSelectedPlan]);

  const handleContinue = () => {
    if (!selectedPlan) return;
    onNext();
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Award color="#F59E0B" /> Choose Your Membership Plan
      </h2>
      <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '24px' }}>
        Select the plan that fits your fitness goals. Upgrade or freeze anytime!
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const featuresArr = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);

          return (
            <div
              key={plan.id}
              className={`plan-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.popular && <div className="badge-popular">MOST POPULAR</div>}

              <h3 style={{ fontSize: '1.2rem', color: '#F8FAFC', marginBottom: '6px' }}>{plan.plan_name}</h3>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', height: '36px', marginBottom: '16px' }}>{plan.description}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>₹{plan.price}</span>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>/ {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                {featuresArr.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#CBD5E1' }}>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <input
          type="checkbox"
          id="terms"
          checked={agreedTerms}
          onChange={(e) => setAgreedTerms(e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: '#F59E0B', cursor: 'pointer' }}
        />
        <label htmlFor="terms" style={{ fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
          I agree to the <strong>Elite Fitness Gym Rules & Membership Terms</strong> (Includes locker usage & safety guidelines).
        </label>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleContinue}
          disabled={!selectedPlan || !agreedTerms}
          style={{ flex: 2 }}
        >
          Proceed to Payment (₹{selectedPlan?.price}) <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
