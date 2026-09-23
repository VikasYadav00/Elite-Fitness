import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, ShieldCheck, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle2, QrCode, Smartphone, Copy, Check, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import api from '../api';
import { publishCloudEvent } from '../cloudSync';

export default function Step4Payment({ formData, selectedPlan, onSuccess, onPrev }) {
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CASH'
  const [utrNumber, setUtrNumber] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [ownerPaymentQr, setOwnerPaymentQr] = useState(() => {
    return localStorage.getItem('ef_payment_qr_url') || '';
  });
  const [ownerQrLabel, setOwnerQrLabel] = useState(() => {
    return localStorage.getItem('ef_payment_qr_label') || 'Gym UPI QR';
  });
  const [upiId, setUpiId] = useState(() => {
    return localStorage.getItem('ef_upi_id') || '8953933110@paytm';
  });
  const [merchantName, setMerchantName] = useState(() => {
    return localStorage.getItem('ef_merchant_name') || 'Elite Fitness Club';
  });
  const [detectedUpi, setDetectedUpi] = useState(null);
  const [allowCashOnQr, setAllowCashOnQr] = useState(() => {
    return localStorage.getItem('ef_allow_cash_on_qr') === 'true'; // false by default
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch payment QR and UPI details from backend settings
  useEffect(() => {
    async function fetchQr() {
      try {
        const res = await api.get('/settings/payment-qr');
        if (res.data?.success && res.data?.data) {
          const { payment_qr_url, payment_qr_label, upi_id: bUpi, merchant_name: bMerchant, allow_cash_on_qr: bAllowCash } = res.data.data;
          if (payment_qr_url) {
            setOwnerPaymentQr(payment_qr_url);
            localStorage.setItem('ef_payment_qr_url', payment_qr_url);
          }
          if (payment_qr_label) {
            setOwnerQrLabel(payment_qr_label);
            localStorage.setItem('ef_payment_qr_label', payment_qr_label);
          }
          if (bUpi) {
            setUpiId(bUpi);
            localStorage.setItem('ef_upi_id', bUpi);
          }
          if (bMerchant) {
            setMerchantName(bMerchant);
            localStorage.setItem('ef_merchant_name', bMerchant);
          }
          if (bAllowCash !== undefined) {
            setAllowCashOnQr(Boolean(bAllowCash));
            localStorage.setItem('ef_allow_cash_on_qr', String(bAllowCash));
          }
        }
      } catch (err) {}
    }
    fetchQr();
  }, []);

  // When ownerPaymentQr is present, scan it with jsQR to extract the real UPI ID
  useEffect(() => {
    if (!ownerPaymentQr || !ownerPaymentQr.startsWith('data:image')) return;
    try {
      const img = new Image();
      img.src = ownerPaymentQr;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data && code.data.toLowerCase().startsWith('upi://pay')) {
          const qs = code.data.split('?')[1];
          if (qs) {
            const params = new URLSearchParams(qs);
            const pa = params.get('pa');
            const pn = params.get('pn');
            if (pa) {
              const decodedPa = decodeURIComponent(pa).trim();
              setDetectedUpi(decodedPa);
              setUpiId(decodedPa);
              localStorage.setItem('ef_upi_id', decodedPa);
            }
            if (pn) {
              const decodedPn = decodeURIComponent(pn).trim();
              setMerchantName(decodedPn);
              localStorage.setItem('ef_merchant_name', decodedPn);
            }
          }
        }
      };
    } catch (_) {}
  }, [ownerPaymentQr]);

  const safeUpiId = (detectedUpi || upiId || '8953933110@paytm').trim();
  const safeMerchant = (merchantName || 'Elite Fitness Club').trim();
  const payableAmount = Number(selectedPlan?.price) || 999;
  const planTitle = selectedPlan?.plan_name || 'Membership Plan';

  // Accurate UPI URI formatted according to NPCI UPI specifications
  const upiUri = `upi://pay?pa=${encodeURIComponent(safeUpiId)}&pn=${encodeURIComponent(safeMerchant)}&am=${encodeURIComponent(payableAmount)}&cu=INR&tn=${encodeURIComponent(`${planTitle} Pass`)}`;

  const isCustomUploadedImage = Boolean(
    typeof ownerPaymentQr === 'string' &&
    ownerPaymentQr.length > 0 &&
    (ownerPaymentQr.startsWith('data:image') || ownerPaymentQr.startsWith('http'))
  );

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(safeUpiId);
    }
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handlePayAndRegister = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'UPI' && (!utrNumber.trim() || utrNumber.trim().length < 6)) {
      setError('Please enter a valid 12-digit UTR or Transaction reference number from your payment app.');
      return;
    }

    setLoading(true);
    setError('');

    const regId = `EF${new Date().getFullYear().toString().slice(-2)}09${Math.floor(Math.random() * 9000) + 1000}`;
    const invoiceNum = `EF-INV-${Date.now().toString().slice(-6)}`;

    // Store registration & payment request in persistent storage so gym owner sees it immediately in Finance & Members
    if (paymentMethod === 'UPI') {
      const utrRequest = {
        id: 'utr_' + Date.now(),
        member_name: formData.full_name,
        reg_id: regId,
        plan: selectedPlan?.plan_name || 'Membership Plan',
        amount: Number(selectedPlan?.price) || 0,
        utr_number: utrNumber.trim(),
        method: 'UPI',
        proof_note: proofNote.trim() || 'Paid via UPI QR on registration portal',
        submitted_at: new Date().toISOString(),
        status: 'PENDING'
      };

      try {
        const existingUtrs = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
        localStorage.setItem('ef_submitted_utr_requests', JSON.stringify([utrRequest, ...existingUtrs]));
      } catch (e) {}

      // Add to custom members list
      try {
        const newMemberObj = {
          id: String(Date.now()),
          registration_id: regId,
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          status: 'INACTIVE', // Activated only upon owner UTR verification
          plan_name: selectedPlan?.plan_name || 'Membership Plan',
          payment_status: 'PENDING',
          payment_method: 'UPI',
          amount_paid: `₹${selectedPlan?.price}`,
          end_date: new Date(Date.now() + (selectedPlan?.duration_months || 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        const existingMembers = JSON.parse(localStorage.getItem('ef_custom_members') || '[]');
        localStorage.setItem('ef_custom_members', JSON.stringify([newMemberObj, ...existingMembers]));
      } catch (e) {}
    } else {
      // CASH AT RECEPTION — STRICT SECURITY:
      // Status MUST be INACTIVE and Payment status MUST be DUE.
      // NEVER grant active pass until gym staff receives cash and verifies it!
      const cashRequest = {
        id: 'cash_' + Date.now(),
        member_name: formData.full_name,
        reg_id: regId,
        plan: selectedPlan?.plan_name || 'Membership Plan',
        amount: Number(selectedPlan?.price) || 0,
        utr_number: 'CASH-PAYMENT-DUE',
        method: 'CASH',
        proof_note: proofNote.trim() || 'Cash payment due at gym reception desk',
        submitted_at: new Date().toISOString(),
        status: 'PENDING_CASH'
      };

      try {
        const existingUtrs = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
        localStorage.setItem('ef_submitted_utr_requests', JSON.stringify([cashRequest, ...existingUtrs]));
      } catch (e) {}

      try {
        const newMemberObj = {
          id: String(Date.now()),
          registration_id: regId,
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          status: 'INACTIVE', // Strictly INACTIVE until cash is handed over to owner
          plan_name: selectedPlan?.plan_name || 'Membership Plan',
          payment_status: 'DUE', // Explicitly DUE
          payment_method: 'CASH',
          amount_paid: '₹0 (Cash Due at Reception)',
          end_date: new Date(Date.now() + (selectedPlan?.duration_months || 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        const existingMembers = JSON.parse(localStorage.getItem('ef_custom_members') || '[]');
        localStorage.setItem('ef_custom_members', JSON.stringify([newMemberObj, ...existingMembers]));
      } catch (e) {}
    }

    // Try posting to backend
    try {
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || 'MALE',
        address: formData.address || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        plan_id: selectedPlan.id,
        payment_method: paymentMethod,
        utr_number: paymentMethod === 'UPI' ? utrNumber.trim() : 'CASH_DUE',
        proof_note: proofNote.trim()
      };

      // Publish to cloud sync (works globally on 4G/5G/Wi-Fi over HTTPS)
      publishCloudEvent('NEW_REGISTRATION', payload).catch(() => {});

      await api.post('/registrations/complete', payload).catch(() => {});
    } catch (err) {
      console.warn('Backend completion note:', err.message);
    } finally {
      setLoading(false);
      onSuccess({
        registrationId: regId,
        memberName: formData.full_name,
        planName: selectedPlan.plan_name,
        amountPaid: selectedPlan.price,
        invoiceNumber: invoiceNum,
        utrNumber: paymentMethod === 'UPI' ? utrNumber.trim() : 'CASH_DUE',
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'UPI' ? 'PENDING_VERIFICATION' : 'PENDING_CASH',
        isMembershipActive: false, // Inactive until owner verifies
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (selectedPlan.duration_months || 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CreditCard color="#F59E0B" /> Payment & Order Summary
      </h2>
      <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '24px' }}>
        Scan the official gym UPI QR code, complete payment, and enter your 12-digit UTR reference number.
      </p>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#F87171',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Order Summary Box */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h4 style={{ fontSize: '0.9rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
          Registration Summary
        </h4>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
          <span style={{ color: '#CBD5E1' }}>Member Name:</span>
          <strong style={{ color: '#F8FAFC' }}>{formData.full_name}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
          <span style={{ color: '#CBD5E1' }}>Selected Plan:</span>
          <strong style={{ color: '#FBBF24' }}>{selectedPlan?.plan_name}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
          <span style={{ color: '#CBD5E1' }}>Plan Duration:</span>
          <span>{selectedPlan?.duration_months} Month(s)</span>
        </div>

        <div style={{
          borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
          paddingTop: '14px',
          marginTop: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total Payable Amount:</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>
            ₹{selectedPlan?.price}
          </span>
        </div>
      </div>

      {/* Payment Options */}
      <div style={{ marginBottom: '24px' }}>
        <label className="label">Select Payment Option</label>

        {allowCashOnQr ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div
              onClick={() => setPaymentMethod('UPI')}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: `2px solid ${paymentMethod === 'UPI' ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
                background: paymentMethod === 'UPI' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.25s ease'
              }}
            >
              <QrCode size={24} color={paymentMethod === 'UPI' ? '#F59E0B' : '#94A3B8'} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F8FAFC' }}>UPI QR Transfer</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>GPay, PhonePe, Paytm</div>
              </div>
            </div>

            <div
              onClick={() => setPaymentMethod('CASH')}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: `2px solid ${paymentMethod === 'CASH' ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
                background: paymentMethod === 'CASH' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.25s ease'
              }}
            >
              <Wallet size={24} color={paymentMethod === 'CASH' ? '#F59E0B' : '#94A3B8'} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F8FAFC' }}>Cash at Reception</div>
                <div style={{ fontSize: '0.75rem', color: '#F87171' }}>Inactive until paid</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            marginTop: '10px',
            padding: '14px 18px',
            borderRadius: '14px',
            border: '2px solid #F59E0B',
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <QrCode size={24} color="#F59E0B" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F8FAFC' }}>
                  Online UPI Transfer (Instant QR Payment)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Pay via GPay, PhonePe, or Paytm and enter 12-digit UTR
                </div>
              </div>
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}>
              <ShieldCheck size={14} /> SECURE UPI
            </div>
          </div>
        )}
      </div>

      {/* UPI QR Display & 12-Digit UTR Entry */}
      {paymentMethod === 'UPI' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '18px',
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {ownerQrLabel || 'Official Gym UPI QR'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
              Pay ₹{payableAmount} to {safeMerchant}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
              Pay directly via UPI App on this phone, or scan the QR from another device:
            </div>
          </div>

          {/* Quick Pay via UPI App (GPay / PhonePe / Paytm) */}
          <a
            href={upiUri}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textDecoration: 'none',
              padding: '12px 20px',
              fontSize: '0.92rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '340px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              color: '#FFFFFF'
            }}
          >
            <Smartphone size={18} /> Tap to Open GPay / PhonePe / Paytm
          </a>

          {/* Copyable UPI ID Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '8px 16px',
            width: '100%',
            maxWidth: '340px'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Official UPI ID</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace' }}>
                {safeUpiId}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyUpi}
              style={{
                padding: '6px 12px',
                background: copiedUpi ? '#10B981' : 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
              {copiedUpi ? 'Copied!' : 'Copy UPI'}
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            — OR SCAN COUNTER QR —
          </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          border: '1.5px solid #10B981',
          borderRadius: '12px',
          padding: '12px 18px',
          color: '#F9FAFB',
          fontSize: '0.85rem',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
        }}>
          {toastMsg}
        </div>
      )}

      {/* QR Code Container */}
      <div style={{
        background: '#FFFFFF',
        padding: '16px',
        borderRadius: '20px',
        boxShadow: '0 12px 32px rgba(245, 158, 11, 0.2), 0 0 0 2px rgba(245, 158, 11, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '260px'
      }}>
        {isCustomUploadedImage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#059669',
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            marginBottom: '10px',
            letterSpacing: '0.04em'
          }}>
            ✓ OFFICIAL GYM STANDEE
          </div>
        )}
        {isCustomUploadedImage ? (
          <img
            src={ownerPaymentQr}
            alt="Gym UPI QR Code"
            style={{ width: '210px', height: '210px', objectFit: 'contain', display: 'block', borderRadius: '10px' }}
            onError={() => setOwnerPaymentQr('')}
          />
        ) : (
          <QRCodeSVG
            value={upiUri}
            size={200}
            level="H"
            includeMargin={false}
          />
        )}
      </div>

      {/* UTR Input Field */}
      <div style={{ width: '100%', marginTop: '6px' }}>
            <label className="label" style={{ color: '#F59E0B', fontSize: '0.9rem', fontWeight: 700 }}>
              Enter 12-Digit UTR Number / Transaction ID *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 238194056291"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              required
              style={{
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                borderColor: utrNumber.length >= 8 ? '#10B981' : 'rgba(245, 158, 11, 0.5)',
                padding: '12px 14px'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px', display: 'block' }}>
              ℹ️ Find the 12-digit UPI Transaction ID / UTR in your payment app (Google Pay, PhonePe, Paytm). The gym owner will verify it to activate your membership pass.
            </span>
          </div>

          {/* Proof Note */}
          <div style={{ width: '100%' }}>
            <label className="label">Payment Note (Optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Paid from Rahul Google Pay account"
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* CASH PAYMENT NOTICE & INACTIVE ALERT */}
      {paymentMethod === 'CASH' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle color="#EF4444" size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#F87171', fontSize: '0.98rem' }}>
                Cash Payment Verification Notice
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Your membership pass will remain INACTIVE until cash is paid at the gym counter.
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            color: '#E2E8F0',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#94A3B8' }}>Amount to Pay at Reception:</span>
              <strong style={{ color: '#F59E0B', fontSize: '1.05rem' }}>₹{selectedPlan?.price}</strong>
            </div>
            <div>
              🏢 <strong>How it works:</strong> After clicking submit below, you will receive an <strong>Inactive Registration Slip</strong>. Show that slip to the gym manager and hand over the cash. Staff will verify and immediately activate your pass.
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Action */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <button
          type="button"
          className="btn-primary glow-pulse"
          onClick={handlePayAndRegister}
          disabled={loading}
          style={{ flex: 2 }}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            paymentMethod === 'UPI' ? (
              <>
                <Lock size={18} /> Submit UTR & Register
              </>
            ) : (
              <>
                <AlertCircle size={18} /> Submit (Pay ₹{selectedPlan?.price} at Reception)
              </>
            )
          )}
        </button>
      </div>
    </div>
  );
}
