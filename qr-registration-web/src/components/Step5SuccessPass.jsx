import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { CheckCircle, Download, Smartphone, ShieldCheck, Sparkles, Calendar, Receipt, Share2, Printer, Check, Clock, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function Step5SuccessPass({ registrationResult, formData, selectedPlan }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const isCashPayment = registrationResult?.paymentMethod === 'CASH' || registrationResult?.paymentStatus === 'PENDING_CASH';

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    // Only fire celebratory confetti for online/verified payments! NEVER for unpaid cash!
    if (!isCashPayment) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FBBF24', '#38BDF8', '#10B981']
      });
    }
  }, [isCashPayment]);

  const regId = registrationResult?.registrationId || `EF${Date.now().toString().slice(-6)}`;
  const memberName = registrationResult?.memberName || formData?.full_name || 'Valued Member';
  const planName = registrationResult?.planName || selectedPlan?.plan_name || 'Membership Plan';
  const amountPaid = registrationResult?.amountPaid || selectedPlan?.price || '2500';
  const invoiceNum = registrationResult?.invoiceNumber || `EF-INV-${Date.now().toString().slice(-6)}`;

  const startDateStr = registrationResult?.startDate
    ? new Date(registrationResult.startDate).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');

  const endDateStr = registrationResult?.endDate
    ? new Date(registrationResult.endDate).toLocaleDateString('en-IN')
    : new Date(Date.now() + (selectedPlan?.duration_months || 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');

  // 1. Download as crisp PNG Image (Zero Chrome security warnings, saves directly to Photos/Gallery)
  const downloadImagePass = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#090D16' });
      const imgData = canvas.toDataURL('image/png');
      const filename = isCashPayment ? `EliteFitness_RegistrationSlip_${regId}.png` : `EliteFitness_Pass_${regId}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(isCashPayment ? '✅ Saved Registration Slip to Photos / Downloads!' : '✅ Saved Digital Pass to Photos / Downloads!');
    } catch (err) {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // 2. Share Pass via native Android sheet (WhatsApp, Google Drive, Files, etc.)
  const sharePass = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#090D16' });
      const filename = isCashPayment ? `EliteFitness_RegistrationSlip_${regId}.png` : `EliteFitness_Pass_${regId}.png`;
      canvas.toBlob(async (blob) => {
        if (!blob) {
          downloadImagePass();
          return;
        }
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: isCashPayment ? 'Elite Fitness Registration Slip (Unpaid)' : 'Elite Fitness Membership Pass',
              text: isCashPayment
                ? `Registration Slip for ${memberName} (ID: ${regId}) — Cash Due at Reception: ₹${amountPaid}`
                : `Digital Gym Pass for ${memberName} (ID: ${regId})`,
              files: [file]
            });
          } catch (e) {
            if (e.name !== 'AbortError') downloadImagePass();
          }
        } else if (navigator.share) {
          try {
            await navigator.share({
              title: 'Elite Fitness Membership Pass',
              text: `Digital Gym Pass for ${memberName} (ID: ${regId}) — Elite Fitness Club`,
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

  // 3. Print / Save as PDF natively
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '36px', textAlign: 'center' }}>
      {isCashPayment ? (
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '2px solid #F59E0B',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <Clock size={36} color="#F59E0B" />
        </div>
      ) : (
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '2px solid #10B981',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <CheckCircle size={36} color="#10B981" />
        </div>
      )}

      {isCashPayment ? (
        <>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>
            Registration Submitted — <span style={{ color: '#F59E0B' }}>Payment Pending</span> ⏳
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '28px' }}>
            Your registration details have been received. Please pay <strong style={{ color: '#F59E0B' }}>₹{amountPaid}</strong> in cash at the reception desk to activate your pass.
          </p>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
            Welcome to <span className="gold-gradient-text">Elite Fitness!</span> 🎉
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '28px' }}>
            Your registration has been submitted. Present your pass at the entrance scanner for access.
          </p>
        </>
      )}

      {/* Digital Membership Pass Card */}
      <div
        ref={cardRef}
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          border: isCashPayment ? '2px dashed rgba(239, 68, 68, 0.7)' : '2px solid #F59E0B',
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '420px',
          margin: '0 auto 32px auto',
          position: 'relative',
          boxShadow: isCashPayment ? '0 15px 35px rgba(239, 68, 68, 0.2)' : '0 15px 35px rgba(245, 158, 11, 0.2)',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.05em', color: '#F8FAFC' }}>
              ELITE <span style={{ color: '#F59E0B' }}>FITNESS</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
              {isCashPayment ? 'REGISTRATION ACKNOWLEDGEMENT SLIP' : 'DIGITAL MEMBERSHIP PASS'}
            </div>
          </div>
          {isCashPayment ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              ⚠️ INACTIVE — PAYMENT DUE
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '9999px',
              textTransform: 'uppercase'
            }}>
              ACTIVE MEMBER
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            background: '#FFFFFF',
            padding: '10px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}>
            <QRCodeSVG
              value={JSON.stringify({
                regId,
                memberName,
                status: isCashPayment ? 'INACTIVE' : 'ACTIVE',
                payment: isCashPayment ? 'UNPAID_CASH_DUE' : 'PAID'
              })}
              size={110}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Member Name</span>
            <strong style={{ fontSize: '1.1rem', color: '#F8FAFC' }}>{memberName}</strong>

            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', marginTop: '4px' }}>Registration ID</span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace' }}>{regId}</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.8rem',
          display: 'flex',
          justify: 'space-between'
        }}>
          <div>
            <span style={{ color: '#94A3B8', display: 'block' }}>Plan Type</span>
            <strong style={{ color: '#FBBF24' }}>{planName}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#94A3B8', display: 'block' }}>
              {isCashPayment ? 'Cash Payable at Desk' : 'Valid Until'}
            </span>
            <strong style={{ color: isCashPayment ? '#EF4444' : '#10B981', fontSize: isCashPayment ? '1rem' : '0.85rem' }}>
              {isCashPayment ? `₹${amountPaid}` : endDateStr}
            </strong>
          </div>
        </div>

        {/* Security Warning inside Slip when Cash is Unpaid */}
        {isCashPayment && (
          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#F87171', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <AlertCircle size={16} /> NOT VALID FOR GYM ENTRY — CASH NOT RECEIVED
            </div>
            <div style={{ color: '#CBD5E1', fontSize: '0.75rem', marginTop: '4px' }}>
              Show this slip at the reception desk and pay ₹{amountPaid} in cash to activate your pass.
            </div>
          </div>
        )}
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
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px', margin: '0 auto' }}>
        {/* Primary: Direct Safe Image Pass (Zero Chrome warning, saves straight to Gallery) */}
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
            gap: '8px'
          }}
        >
          <Download size={18} /> {downloading ? 'Saving...' : (isCashPayment ? 'Download Registration Slip (Unpaid)' : 'Download Pass (Save to Photos)')}
        </button>

        {/* Secondary: Mobile System Share (WhatsApp / Drive / Files) */}
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
            <Share2 size={16} /> {sharing ? 'Opening...' : (isCashPayment ? 'Share Slip' : 'Share Pass')}
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
            <div style={{ fontWeight: 700 }}>Download the Elite Fitness App</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Track your daily workouts, diet plans & attendance right from your phone.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
