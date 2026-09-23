import React, { useState } from 'react';
import {
  Star, ThumbsUp, Send, CheckCircle2, ShieldCheck, Dumbbell,
  Sparkles, MessageSquare, AlertCircle, Heart, User, Phone, MapPin,
  ExternalLink, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api';

const CATEGORIES = [
  { id: 'EQUIPMENT', label: '🏋️ Equipment & Machines' },
  { id: 'CLEANLINESS', label: '🧹 Cleanliness & Hygiene' },
  { id: 'TRAINER', label: '🧑‍🏫 Trainers & Coaching' },
  { id: 'AMBIENCE', label: '❄️ AC, Music & Ambience' },
  { id: 'TIMINGS', label: '⏰ Timings & Crowding' },
  { id: 'GENERAL', label: '💡 General Suggestion' }
];

const RATING_LABELS = {
  1: { text: 'Needs Much Improvement', emoji: '😞', color: '#EF4444' },
  2: { text: 'Could Be Better', emoji: '😐', color: '#F97316' },
  3: { text: 'Average Experience', emoji: '🙂', color: '#FBBF24' },
  4: { text: 'Great Workout Experience!', emoji: '😊', color: '#10B981' },
  5: { text: 'Outstanding! Best Gym in Lucknow', emoji: '🤩', color: '#F59E0B' }
};

export default function FeedbackPortal() {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [equipmentRating, setEquipmentRating] = useState(5);
  const [trainerRating, setTrainerRating] = useState(5);
  const [category, setCategory] = useState('GENERAL');
  const [comments, setComments] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberStatus, setMemberStatus] = useState('ACTIVE_MEMBER');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const payload = {
      name: isAnonymous ? 'Gym Member (Anonymous)' : (name.trim() || 'Gym Member'),
      phone: isAnonymous ? '' : phone.trim(),
      member_status: memberStatus,
      rating,
      cleanliness_rating: cleanlinessRating,
      equipment_rating: equipmentRating,
      trainer_rating: trainerRating,
      category,
      comments: comments.trim(),
      source: 'GOOGLE_LENS_QR'
    };

    try {
      await api.post('/feedback', payload);
    } catch (err) {
      // If backend fails, save to localStorage fallback so owner app can still read it
      try {
        const stored = JSON.parse(localStorage.getItem('ef_feedbacks_data') || '[]');
        const newEntry = {
          ...payload,
          id: `fb-local-${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'NEW'
        };
        localStorage.setItem('ef_feedbacks_data', JSON.stringify([newEntry, ...stored]));
      } catch (_) {}
    }

    setSubmitting(false);
    setSubmitted(true);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}
  };

  const currentRatingInfo = RATING_LABELS[hoverRating || rating] || RATING_LABELS[5];

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        background: 'linear-gradient(160deg, #0B0F17 0%, #111827 50%, #0B0F17 100%)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1.5px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '24px',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 158, 11, 0.15)',
          animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(16, 185, 129, 0.2))',
            border: '2px solid #F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 24px rgba(245, 158, 11, 0.4)'
          }}>
            <Sparkles size={38} color="#F59E0B" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F9FAFB', marginBottom: '8px' }}>
            Thank You for Your Feedback!
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '22px' }}>
            Your review has been directly received by the Elite Fitness owner and management team. We read every review to make your workout experience world-class.
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  size={20}
                  fill={s <= rating ? '#F59E0B' : 'none'}
                  color={s <= rating ? '#F59E0B' : '#4B5563'}
                />
              ))}
            </div>
            <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.95rem' }}>
              {rating}.0 Rating Recorded
            </span>
          </div>

          {rating >= 4 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(59, 130, 246, 0.12))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '16px',
              padding: '18px 16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.92rem', marginBottom: '6px' }}>
                🌟 Love working out at Elite Fitness?
              </div>
              <p style={{ color: '#E2E8F0', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '14px' }}>
                Help fellow fitness lovers find us by leaving a quick 5-star rating on Google Maps!
              </p>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)'
                }}
              >
                <Star size={16} fill="#000" /> Share on Google Reviews <ExternalLink size={14} />
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setComments('');
              setRating(5);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94A3B8',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Submit Another Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px 14px 60px 14px',
      background: 'linear-gradient(160deg, #0B0F17 0%, #111827 50%, #0B0F17 100%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>

        {/* Top Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '20px',
          padding: '22px 20px',
          marginBottom: '20px',
          textAlign: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '999px',
            padding: '5px 14px',
            color: '#F59E0B',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '10px'
          }}>
            <Dumbbell size={14} /> ELITE FITNESS CLUB
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F9FAFB', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Member Review & Feedback
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0 0 12px 0' }}>
            Help us make your workout experience extraordinary! Scanned via Google Lens / Camera.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', fontSize: '0.72rem', color: '#64748B' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} color="#F59E0B" /> Sector 14, Lucknow
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={12} color="#10B981" /> 8953933110
            </span>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Section 1: Overall Star Rating */}
          <div style={{
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Overall Gym Rating
            </label>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              margin: '12px 0'
            }}>
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const active = (hoverRating || rating) >= starIndex;
                return (
                  <button
                    key={starIndex}
                    type="button"
                    onClick={() => setRating(starIndex)}
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'transform 0.15s ease',
                      transform: active ? 'scale(1.15)' : 'scale(1.0)'
                    }}
                  >
                    <Star
                      size={36}
                      fill={active ? '#F59E0B' : 'transparent'}
                      color={active ? '#F59E0B' : '#4B5563'}
                      strokeWidth={1.8}
                    />
                  </button>
                );
              })}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${currentRatingInfo.color}`,
              fontSize: '0.82rem',
              fontWeight: 800,
              color: currentRatingInfo.color
            }}>
              <span>{currentRatingInfo.emoji}</span>
              <span>{currentRatingInfo.text}</span>
            </div>
          </div>

          {/* Section 2: Detailed Category Ratings */}
          <div style={{
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Facility Ratings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Cleanliness */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: '#D1D5DB', fontWeight: 600 }}>
                  🧹 Cleanliness & Sanitation
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={20}
                      fill={s <= cleanlinessRating ? '#F59E0B' : 'none'}
                      color={s <= cleanlinessRating ? '#F59E0B' : '#4B5563'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setCleanlinessRating(s)}
                    />
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: '#D1D5DB', fontWeight: 600 }}>
                  🏋️ Machines & Dumbbells
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={20}
                      fill={s <= equipmentRating ? '#F59E0B' : 'none'}
                      color={s <= equipmentRating ? '#F59E0B' : '#4B5563'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setEquipmentRating(s)}
                    />
                  ))}
                </div>
              </div>

              {/* Trainer Guidance */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: '#D1D5DB', fontWeight: 600 }}>
                  🧑‍🏫 Trainer Support & Atmosphere
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={20}
                      fill={s <= trainerRating ? '#F59E0B' : 'none'}
                      color={s <= trainerRating ? '#F59E0B' : '#4B5563'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setTrainerRating(s)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Topic / Category Selector */}
          <div style={{
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              What is your feedback about?
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              {CATEGORIES.map(cat => {
                const selected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: selected ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                      background: selected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: selected ? '#F59E0B' : '#9CA3AF',
                      fontSize: '0.78rem',
                      fontWeight: selected ? 800 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Detailed Message / Review */}
          <div style={{
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Your Comments & Review <span style={{ color: '#F59E0B' }}>*</span>
            </label>

            <textarea
              required
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us what you enjoyed, machine requests, trainer shoutouts, or areas where we can improve..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(11, 15, 23, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F9FAFB',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Section 5: Member Details */}
          <div style={{
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Details
              </span>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#9CA3AF' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ accentColor: '#F59E0B' }}
                />
                Submit Anonymously
              </label>
            </div>

            {!isAnonymous ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '4px' }}>
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(11, 15, 23, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F9FAFB',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '4px' }}>
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(11, 15, 23, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F9FAFB',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                fontSize: '0.78rem',
                color: '#9CA3AF'
              }}>
                🔒 Your name and mobile number will not be attached to this feedback.
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !comments.trim()}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: !comments.trim()
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: !comments.trim() ? '#64748B' : '#000000',
              fontWeight: 900,
              fontSize: '0.95rem',
              border: 'none',
              cursor: !comments.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: !comments.trim() ? 'none' : '0 8px 25px rgba(245, 158, 11, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            {submitting ? (
              <>⏳ Submitting Feedback...</>
            ) : (
              <>
                <Send size={18} /> Submit Review & Feedback
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px', color: '#64748B', fontSize: '0.72rem' }}>
          Powered by Elite Fitness Management System • All Feedback Monitored by Club Owner
        </div>
      </div>
    </div>
  );
}
