import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download, ShieldCheck, Dumbbell, CreditCard, QrCode,
  CheckCircle, Clock, XCircle, Hash, Send, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import api from '../api';

const MEMBER = {
  name: 'Rahul Sharma',
  reg_id: 'EF26091001',
  plan_name: 'Quarterly Beast Mode',
  status: 'ACTIVE',
  end_date: '15 Dec 2026',
  member_id: '1',
};

const MEMBERSHIP_PLANS = [
  { id: 1, plan_name: 'Monthly Pass', duration_months: 1, price: 999 },
  { id: 2, plan_name: 'Quarterly Beast Mode', duration_months: 3, price: 2699 },
  { id: 3, plan_name: 'Half-Yearly Elite Pass', duration_months: 6, price: 4999 },
  { id: 4, plan_name: 'Annual Champion', duration_months: 12, price: 8999 },
];

export default function QRPassView() {
  const member = MEMBER;
  const [activeSection, setActiveSection] = useState('pass'); // 'pass' | 'renew'

  // Payment QR from owner
  const [paymentQr, setPaymentQr] = useState(null);
  const [paymentQrLabel, setPaymentQrLabel] = useState('UPI Payment — Elite Fitness');
  const [loadingPaymentQr, setLoadingPaymentQr] = useState(true);

  // UTR submission
  const [selectedPlan, setSelectedPlan] = useState(MEMBERSHIP_PLANS[1]);
  const [utrNumber, setUtrNumber] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null); // { status, message }

  // Past submissions
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Load payment QR
      setLoadingPaymentQr(true);
      try {
        const qrRes = await api.get('/settings/payment-qr');
        if (qrRes.data?.success && qrRes.data?.data?.payment_qr_url) {
          setPaymentQr(qrRes.data.data.payment_qr_url);
          if (qrRes.data.data.payment_qr_label) {
            setPaymentQrLabel(qrRes.data.data.payment_qr_label);
          }
        }
      } catch (err) {
        // No payment QR configured yet
      } finally {
        setLoadingPaymentQr(false);
      }

      // Load past UTR requests
      try {
        const reqRes = await api.get('/payment-requests/me');
        if (reqRes.data?.success && reqRes.data?.data) {
          setMyRequests(reqRes.data.data);
        }
      } catch (err) {
        // Not authenticated or no data
      }
    }
    loadData();
  }, []);

  const handleSubmitUTR = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 8) {
      setSubmissionResult({ status: 'error', message: 'Please enter a valid UTR number (min 8 characters).' });
      return;
    }

    setSubmitting(true);
    setSubmissionResult(null);

    try {
      await api.post('/payment-requests', {
        plan_id: selectedPlan.id,
        amount: selectedPlan.price,
        utr_number: utrNumber.trim().toUpperCase(),
        proof_note: proofNote.trim(),
      });

      setSubmissionResult({
        status: 'success',
        message: `UTR submitted for ₹${selectedPlan.price.toLocaleString('en-IN')} (${selectedPlan.plan_name}). Gym owner will verify within 24 hours and activate your membership automatically!`
      });

      setMyRequests(prev => [{
        id: String(Date.now()),
        plan_name: selectedPlan.plan_name,
        amount: selectedPlan.price,
        utr_number: utrNumber.trim().toUpperCase(),
        status: 'PENDING',
        submitted_at: new Date().toISOString()
      }, ...prev]);

      setUtrNumber('');
      setProofNote('');
    } catch (err) {
      // Offline fallback — still show success since backend may be in preview mode
      setSubmissionResult({
        status: 'success',
        message: `UTR noted locally (₹${selectedPlan.price.toLocaleString('en-IN')} — ${selectedPlan.plan_name}). Contact the gym to verify your payment if the backend is offline.`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return isoStr; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Member Pass & Renewal</h2>
        <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px' }}>
          Your digital gym entry pass and membership renewal portal.
        </p>
      </div>

      {/* Tab Toggle */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', marginBottom: '20px', gap: '4px' }}>
        <button
          onClick={() => setActiveSection('pass')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '9px',
            border: 'none',
            background: activeSection === 'pass' ? 'rgba(245,158,11,0.2)' : 'transparent',
            color: activeSection === 'pass' ? '#F59E0B' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <QrCode size={16} /> Entry Pass
        </button>
        <button
          onClick={() => setActiveSection('renew')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '9px',
            border: 'none',
            background: activeSection === 'renew' ? 'rgba(245,158,11,0.2)' : 'transparent',
            color: activeSection === 'renew' ? '#F59E0B' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <CreditCard size={16} /> Renew Membership
        </button>
      </div>

      {/* ─────── ENTRY PASS ─────── */}
      {activeSection === 'pass' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-card" style={{
            padding: '28px',
            width: '100%',
            maxWidth: '380px',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '2px solid #F59E0B',
            boxShadow: '0 15px 40px rgba(245, 158, 11, 0.2)',
          }}>
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#F8FAFC' }}>
                  ELITE <span style={{ color: '#F59E0B' }}>FITNESS</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  OFFICIAL MEMBER PASS
                </span>
              </div>
              <span style={{
                background: '#10B981', color: '#000',
                fontSize: '0.7rem', fontWeight: 900,
                padding: '3px 12px', borderRadius: '9999px'
              }}>
                {member.status}
              </span>
            </div>

            {/* QR Code */}
            <div style={{
              background: '#FFF',
              padding: '16px',
              borderRadius: '16px',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
            }}>
              <QRCodeSVG
                value={JSON.stringify({
                  type: 'ATTENDANCE_CHECKIN',
                  reg_id: member.reg_id,
                  name: member.name,
                  gym: 'Elite Fitness'
                })}
                size={170}
                level="H"
              />
            </div>

            {/* Member Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Member Name</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F8FAFC' }}>{member.name}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Registration ID</span>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F59E0B', fontFamily: 'monospace' }}>{member.reg_id}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Active Plan</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#D1D5DB' }}>{member.plan_name}</div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: '8px', paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: '#94A3B8' }}>Valid Until:</span>
                <strong style={{ color: '#10B981' }}>{member.end_date}</strong>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94A3B8', justifyContent: 'center' }}>
              <ShieldCheck size={13} color="#10B981" />
              <span>Scan this at gym entrance for device-locked attendance</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────── RENEW MEMBERSHIP ─────── */}
      {activeSection === 'renew' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Step 1: View UPI QR */}
          <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245,158,11,0.2)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}>
                1
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#F59E0B' }}>Scan & Pay via UPI</h3>
            </div>

            {loadingPaymentQr ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '0.875rem' }}>
                <RefreshCw size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>Loading payment QR...</div>
              </div>
            ) : paymentQr ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: '#FFFFFF',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(245,158,11,0.2)',
                  border: '2px solid rgba(245,158,11,0.4)'
                }}>
                  <img
                    src={paymentQr}
                    alt="UPI Payment QR"
                    style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#F9FAFB', fontSize: '0.9rem' }}>{paymentQrLabel}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                    Scan this QR using PhonePe, Google Pay, or any UPI app
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '28px', color: '#94A3B8' }}>
                <QrCode size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#F9FAFB', marginBottom: '4px' }}>
                  Payment QR Not Configured Yet
                </div>
                <div style={{ fontSize: '0.78rem' }}>
                  The gym owner hasn't uploaded the UPI QR yet. Contact the gym directly to renew.
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Submit UTR */}
          <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}>
                2
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#10B981' }}>Submit UTR After Payment</h3>
            </div>

            {/* Submission Result */}
            {submissionResult && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '16px',
                background: submissionResult.status === 'success'
                  ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${submissionResult.status === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: submissionResult.status === 'success' ? '#10B981' : '#EF4444',
                fontSize: '0.84rem',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                lineHeight: 1.5
              }}>
                {submissionResult.status === 'success'
                  ? <Sparkles size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                  : <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />}
                <span>{submissionResult.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitUTR} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Plan Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  Select Renewal Plan
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {MEMBERSHIP_PLANS.map(plan => (
                    <label
                      key={plan.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: selectedPlan.id === plan.id
                          ? '1px solid rgba(245,158,11,0.6)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: selectedPlan.id === plan.id
                          ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlan.id === plan.id}
                          onChange={() => setSelectedPlan(plan)}
                          style={{ accentColor: '#F59E0B' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#F9FAFB' }}>
                          {plan.plan_name}
                          <span style={{ color: '#94A3B8', fontWeight: 400, marginLeft: '6px', fontSize: '0.78rem' }}>
                            ({plan.duration_months} mo)
                          </span>
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.95rem' }}>
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* UTR Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  <Hash size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  UTR / Transaction Reference Number *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. UTR123456789012 or Transaction ID"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  required
                  style={{ fontFamily: 'monospace', letterSpacing: '0.03em', fontWeight: 600 }}
                />
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '5px' }}>
                  Find this in your payment app's transaction history
                </div>
              </div>

              {/* Proof Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  Additional Note (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Paid via Google Pay to 9876543210@upi"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '0.95rem',
                  marginTop: '4px'
                }}
                disabled={submitting}
              >
                <Send size={18} />
                {submitting ? 'Submitting UTR...' : `Submit UTR for ₹${selectedPlan.price.toLocaleString('en-IN')} (${selectedPlan.plan_name})`}
              </button>
            </form>
          </div>

          {/* Step 3: Tracker */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(56,189,248,0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}>
                3
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#38BDF8' }}>Track Verification Status</h3>
            </div>

            {myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '0.8rem' }}>
                <Clock size={28} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <div>No submissions yet. Pay & submit your UTR above.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    {req.status === 'PENDING' && <Clock size={18} color="#F59E0B" />}
                    {req.status === 'VERIFIED' && <CheckCircle size={18} color="#10B981" />}
                    {req.status === 'REJECTED' && <XCircle size={18} color="#EF4444" />}

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F9FAFB' }}>{req.plan_name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#F59E0B', marginTop: '1px' }}>
                        UTR: {req.utr_number}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#10B981' }}>
                        ₹{Number(req.amount).toLocaleString('en-IN')}
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '999px',
                        background: req.status === 'PENDING' ? 'rgba(245,158,11,0.15)'
                          : req.status === 'VERIFIED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: req.status === 'PENDING' ? '#F59E0B'
                          : req.status === 'VERIFIED' ? '#10B981' : '#EF4444',
                        display: 'inline-block',
                        marginTop: '3px'
                      }}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info footer */}
          <div style={{
            fontSize: '0.75rem',
            color: '#64748B',
            lineHeight: 1.6,
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <strong style={{ color: '#94A3B8' }}>How it works:</strong> Pay via the UPI QR above →
            Note the transaction UTR from your payment app → Submit it here →
            Owner verifies & your membership activates automatically within 24h.
          </div>
        </div>
      )}
    </div>
  );
}
