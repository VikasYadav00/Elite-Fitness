import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  CheckCircle, Download, Smartphone, ShieldCheck, ShieldAlert,
  Sparkles, Calendar, Receipt, Share2, Printer, Check, Clock,
  AlertCircle, Lock, Unlock, RefreshCw, Copy
} from 'lucide-react';
import html2canvas from 'html2canvas';
import api from '../api';
import { subscribeCloudStream } from '../cloudSync';

export default function Step5SuccessPass({ registrationResult, formData, selectedPlan }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine initial payment and locked state
  const isCashInitial =
    registrationResult?.paymentMethod === 'CASH' ||
    registrationResult?.paymentStatus === 'PENDING_CASH' ||
    registrationResult?.isPassLocked === true;

  const [isPassUnlocked, setIsPassUnlocked] = useState(!isCashInitial);

  const regId = registrationResult?.registrationId || `EF${Date.now().toString().slice(-6)}`;
  const memberName = registrationResult?.memberName || formData?.full_name || 'Valued Member';
  const memberPhone = formData?.phone || registrationResult?.phone || '';
  const planName = registrationResult?.planName || selectedPlan?.plan_name || 'Membership Plan';
  const amountPaid = registrationResult?.amountPaid || selectedPlan?.price || '2500';
  const invoiceNum = registrationResult?.invoiceNumber || `EF-INV-${Date.now().toString().slice(-6)}`;

  const startDateStr = registrationResult?.startDate
    ? new Date(registrationResult.startDate).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');

  const endDateStr = registrationResult?.endDate
    ? new Date(registrationResult.endDate).toLocaleDateString('en-IN')
    : new Date(Date.now() + (selectedPlan?.duration_months || 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(regId);
      setCopied(true);
      showToast('📋 Copied Registration ID to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const unlockPass = () => {
    setIsPassUnlocked(true);
    showToast('🎉 Cash payment confirmed! Your Digital Pass is now UNLOCKED and ACTIVE!');
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#38BDF8', '#FBBF24']
    });
  };

  // Function to verify if Gym Owner has approved / collected cash
  const checkStatus = async (showFeedback = false) => {
    if (isPassUnlocked) return;
    if (showFeedback) setCheckingStatus(true);

    try {
      // 1. Check local storage overrides / requests (instant sync across tabs/owner-app on same browser)
      const storedUtrs = JSON.parse(localStorage.getItem('ef_submitted_utr_requests') || '[]');
      const matchedUtr = storedUtrs.find(u => u.reg_id === regId || (u.member_name && u.member_name.toLowerCase() === memberName.toLowerCase()));
      // Must be explicitly VERIFIED by owner, never PENDING or PENDING_CASH
      if (matchedUtr && matchedUtr.status === 'VERIFIED') {
        unlockPass();
        return;
      }

      const customMembers = JSON.parse(localStorage.getItem('ef_custom_members') || '[]');
      const matchedMember = customMembers.find(
        m => m.registration_id === regId || (m.phone && memberPhone && m.phone.slice(-10) === memberPhone.slice(-10))
      );
      if (
        matchedMember &&
        matchedMember.status === 'ACTIVE' &&
        (matchedMember.payment_status === 'PAID' || matchedMember.payment_status === 'SUCCESS') &&
        matchedMember.payment_status !== 'DUE' &&
        matchedMember.payment_status !== 'PENDING_CASH' &&
        matchedMember.payment_status !== 'PENDING'
      ) {
        unlockPass();
        return;
      }

      // 2. Check backend API live status
      const res = await api.get(`/registrations/status/${regId}`);
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (
          d.membershipStatus === 'ACTIVE' &&
          !d.isPassLocked &&
          (d.paymentStatus === 'PAID' || d.paymentStatus === 'SUCCESS') &&
          d.paymentStatus !== 'DUE' &&
          d.paymentStatus !== 'PENDING_CASH'
        ) {
          unlockPass();
          return;
        }
      }

      if (showFeedback) {
        showToast('⏳ Cash payment still pending at reception. Please pay at the counter to activate.');
      }
    } catch (_) {
      if (showFeedback) {
        showToast('⏳ Awaiting reception cash confirmation.');
      }
    } finally {
      if (showFeedback) setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (!isCashInitial) {
      // Online payment is already verified!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FBBF24', '#38BDF8', '#10B981']
      });
      return;
    }

    // Auto-poll verification status every 3.5 seconds
    const interval = setInterval(() => {
      checkStatus(false);
    }, 3500);

    // Listen for storage events from Owner App / other tabs
    const handleStorage = (e) => {
      if (
        e.key === 'ef_submitted_utr_requests' ||
        e.key === 'ef_custom_members' ||
        e.key === 'ef_payment_verified_event'
      ) {
        checkStatus(false);
      }
    };
    window.addEventListener('storage', handleStorage);

    // Real-time SSE listener for instant unlock worldwide
    const unsubscribeCloud = subscribeCloudStream((msg) => {
      if (msg.event === 'PAYMENT_VERIFIED' && msg.data) {
        if (msg.data.reg_id === regId || (msg.data.member_name && msg.data.member_name.toLowerCase() === memberName.toLowerCase())) {
          unlockPass();
        }
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      unsubscribeCloud();
    };
  }, [isCashInitial, isPassUnlocked, regId, memberName]);

  // Download image (either Official Pass if unlocked, or Locked Token Slip if pending)
  const downloadImagePass = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#090D16' });
      const imgData = canvas.toDataURL('image/png');
      const filename = !isPassUnlocked
        ? `EliteFitness_PaymentDueToken_${regId}.png`
        : `EliteFitness_OfficialPass_${regId}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(!isPassUnlocked ? '✅ Saved Payment Due Slip to Downloads!' : '✅ Saved Digital Membership Pass to Photos / Downloads!');
    } catch (err) {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // Share Pass via native Android/iOS sheet
  const sharePass = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#090D16' });
      const filename = !isPassUnlocked
        ? `EliteFitness_PaymentDueToken_${regId}.png`
        : `EliteFitness_OfficialPass_${regId}.png`;
      canvas.toBlob(async (blob) => {
        if (!blob) {
          downloadImagePass();
          return;
        }
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: !isPassUnlocked ? 'Elite Fitness Payment Token (Unpaid)' : 'Elite Fitness Membership Pass',
              text: !isPassUnlocked
                ? `Registration Token for ${memberName} (ID: ${regId}) — Cash Due at Reception: ₹${amountPaid}`
                : `Digital Gym Pass for ${memberName} (ID: ${regId})`,
              files: [file]
            });
          } catch (e) {
            if (e.name !== 'AbortError') downloadImagePass();
          }
        } else if (navigator.share) {
          try {
            await navigator.share({
              title: !isPassUnlocked ? 'Elite Fitness Payment Token (Unpaid)' : 'Elite Fitness Membership Pass',
              text: `Elite Fitness - ${memberName} (ID: ${regId})`,
              url: window.location.href
            });
          } catch (e) {
            if (e.name !== 'AbortError') downloadImagePass();
          }
        } else {
          downloadImagePass();
        }
      }, 'image/png');
    } catch (_) {
      downloadImagePass();
    } finally {
      setSharing(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '36px 20px', textAlign: 'center' }}>
      {/* Top Header Badge */}
      {!isPassUnlocked ? (
        <>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2.5px solid #EF4444',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)'
          }}>
            <Lock size={38} color="#EF4444" />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '6px', color: '#F8FAFC' }}>
            Registration Submitted — <span style={{ color: '#EF4444' }}>Pass Locked 🔒</span>
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            Your registration is received, but <strong style={{ color: '#F59E0B' }}>no entrance pass or QR code is issued</strong> yet.
            Please pay <strong style={{ color: '#10B981' }}>₹{amountPaid}</strong> in cash at the reception desk to unlock your digital pass.
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2.5px solid #10B981',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle size={40} color="#10B981" />
          </div>

          <h2 style={{ fontSize: '1.85rem', marginBottom: '6px', color: '#F8FAFC' }}>
            Welcome to <span className="gold-gradient-text">Elite Fitness!</span> 🎉
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', marginBottom: '28px' }}>
            {isCashInitial
              ? '✅ Cash payment verified by manager! Your Official Membership Pass is now UNLOCKED.'
              : 'Your online payment was verified. Present your pass at the entrance scanner for gym access.'}
          </p>
        </>
      )}

      {/* Main Pass or Locked Token Card */}
      <div
        ref={cardRef}
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          border: !isPassUnlocked ? '2px dashed rgba(239, 68, 68, 0.7)' : '2px solid #F59E0B',
          borderRadius: '24px',
          padding: '28px 24px',
          maxWidth: '430px',
          margin: '0 auto 28px auto',
          position: 'relative',
          boxShadow: !isPassUnlocked ? '0 15px 35px rgba(239, 68, 68, 0.22)' : '0 15px 35px rgba(245, 158, 11, 0.25)',
          textAlign: 'left'
        }}
      >
        {/* Pass Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.05em', color: '#F8FAFC' }}>
              ELITE <span style={{ color: '#F59E0B' }}>FITNESS</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
              {!isPassUnlocked ? 'PAYMENT DUE TOKEN (UNPAID)' : 'OFFICIAL MEMBERSHIP PASS'}
            </div>
          </div>

          {!isPassUnlocked ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '5px 11px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Lock size={12} /> PASS LOCKED
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '5px 12px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle size={12} /> ACTIVE MEMBER
            </div>
          )}
        </div>

        {/* Center: QR Code (if unlocked) OR Locked Padlock Box (if cash pending) */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '20px' }}>
          {isPassUnlocked ? (
            <div style={{
              background: '#FFFFFF',
              padding: '10px',
              borderRadius: '14px',
              boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
              flexShrink: 0
            }}>
              <QRCodeSVG
                value={JSON.stringify({
                  type: 'ATTENDANCE_CHECKIN',
                  regId,
                  memberName,
                  status: 'ACTIVE',
                  gym: 'Elite Fitness'
                })}
                size={110}
                level="M"
              />
            </div>
          ) : (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '2px dashed rgba(239, 68, 68, 0.45)',
              borderRadius: '16px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '110px',
              height: '110px',
              flexShrink: 0,
              textAlign: 'center'
            }}>
              <Lock size={32} color="#EF4444" />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F87171', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                NO QR CODE
              </span>
              <span style={{ fontSize: '0.58rem', color: '#94A3B8', lineHeight: 1.1 }}>
                Unlocks on Cash Payment
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase' }}>Member Name</span>
            <strong style={{ fontSize: '1.05rem', color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {memberName}
            </strong>

            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px' }}>
              {!isPassUnlocked ? 'Application / Token ID' : 'Registration ID'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace' }}>
                {regId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: copied ? '#10B981' : '#94A3B8',
                  padding: '2px'
                }}
                title="Copy ID"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Plan & Payment Details */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Selected Plan</span>
            <strong style={{ color: '#FBBF24', fontSize: '0.88rem' }}>{planName}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>
              {!isPassUnlocked ? 'Cash Due at Counter' : 'Valid Until'}
            </span>
            <strong style={{ color: !isPassUnlocked ? '#EF4444' : '#10B981', fontSize: !isPassUnlocked ? '1.05rem' : '0.88rem' }}>
              {!isPassUnlocked ? `₹${amountPaid}` : endDateStr}
            </strong>
          </div>
        </div>

        {/* Security Warning Notice inside Card */}
        {!isPassUnlocked ? (
          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#F87171', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldAlert size={16} /> 🚫 NOT VALID FOR GYM ENTRANCE
            </div>
            <div style={{ color: '#CBD5E1', fontSize: '0.74rem', marginTop: '4px', lineHeight: 1.4 }}>
              This token is <strong>locked</strong>. Present token <strong>{regId}</strong> to the gym manager and pay ₹{amountPaid} in cash. Your pass will unlock immediately upon verification.
            </div>
          </div>
        ) : (
          <div style={{
            marginTop: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            color: '#10B981',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={16} /> Verified Official Member • Valid for Entrance Scanner
          </div>
        )}
      </div>

      {/* Live Check / Auto-Unlock Action for Cash */}
      {!isPassUnlocked && (
        <div style={{
          maxWidth: '430px',
          margin: '0 auto 24px auto',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '16px',
          padding: '18px 20px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} /> Live Verification Monitor
            </span>
            <button
              type="button"
              onClick={() => checkStatus(true)}
              disabled={checkingStatus}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #F59E0B',
                color: '#F59E0B',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={13} className={checkingStatus ? 'animate-spin' : ''} />
              {checkingStatus ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#F59E0B', fontWeight: 800 }}>1.</span>
              <span>Go to the Elite Fitness reception / front desk.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#F59E0B', fontWeight: 800 }}>2.</span>
              <span>Show your Token ID: <strong style={{ color: '#F59E0B' }}>{regId}</strong> and pay <strong style={{ color: '#10B981' }}>₹{amountPaid}</strong> cash.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#F59E0B', fontWeight: 800 }}>3.</span>
              <span>Staff clicks <em>"Collect Cash & Activate"</em> on the Owner Terminal.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#10B981', fontWeight: 800 }}>4.</span>
              <span><strong>Your Digital Pass & Entrance QR will unlock here automatically!</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '430px', margin: '0 auto' }}>
        {/* Primary Download Button */}
        <button
          type="button"
          className="btn-primary"
          onClick={downloadImagePass}
          disabled={downloading}
          style={{
            padding: '14px 20px',
            fontSize: '0.95rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: !isPassUnlocked
              ? 'linear-gradient(135deg, #475569, #334155)'
              : 'linear-gradient(135deg, #F59E0B, #D97706)'
          }}
        >
          <Download size={18} />
          {downloading
            ? 'Saving...'
            : !isPassUnlocked
              ? 'Download Payment Due Slip (Unpaid)'
              : 'Download Pass (Save to Photos)'}
        </button>

        {/* Secondary Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={sharePass}
            disabled={sharing}
            style={{
              padding: '12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Share2 size={16} /> {sharing ? 'Opening...' : (!isPassUnlocked ? 'Share Slip' : 'Share Pass')}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrintPDF}
            style={{
              padding: '12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Printer size={16} /> Save PDF / Print
          </button>
        </div>

        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '14px',
          padding: '16px',
          fontSize: '0.85rem',
          color: '#E0F2FE',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
          marginTop: '6px'
        }}>
          <Smartphone size={28} color="#38BDF8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700 }}>Elite Fitness Member App</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Track workouts, diet schedules & attendance once your pass is activated.
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
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
    </div>
  );
}
