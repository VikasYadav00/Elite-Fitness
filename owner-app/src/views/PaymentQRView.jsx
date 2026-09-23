import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard, Upload, Check, AlertCircle, X, Download,
  Printer, Share2, Sparkles, Smartphone, ShieldCheck,
  CheckCircle2, RefreshCw, Copy, ExternalLink, QrCode
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import jsQR from 'jsqr';
import api from '../api';

export default function PaymentQRView() {
  const [upiId, setUpiId] = useState(() => {
    return localStorage.getItem('ef_upi_id') || '8953933110@paytm';
  });
  const [merchantName, setMerchantName] = useState(() => {
    return localStorage.getItem('ef_merchant_name') || 'Elite Fitness Club';
  });
  const [paymentQrLabel, setPaymentQrLabel] = useState(() => {
    return localStorage.getItem('ef_payment_qr_label') || 'Pay to Elite Fitness — Membership & Renewals';
  });
  const [paymentQrUrl, setPaymentQrUrl] = useState(() => {
    return localStorage.getItem('ef_payment_qr_url') || '';
  });
  const [allowCashOnQr, setAllowCashOnQr] = useState(() => {
    return localStorage.getItem('ef_allow_cash_on_qr') === 'true'; // false by default
  });

  const [savingPaymentQr, setSavingPaymentQr] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [downloadingStandee, setDownloadingStandee] = useState(false);
  const [sharingStandee, setSharingStandee] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const qrCanvasRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Safe strings
  const safeUpiId = (upiId || '8953933110@paytm').trim();
  const safeMerchant = (merchantName || 'Elite Fitness Club').trim();

  // Standard UPI URI string for auto-generated QR
  const upiUri = `upi://pay?pa=${encodeURIComponent(safeUpiId)}&pn=${encodeURIComponent(safeMerchant)}&cu=INR&tn=${encodeURIComponent('Gym Membership Fee')}`;

  // Check if an image is uploaded (safe boolean, never null or undefined)
  const isCustomImage = Boolean(
    typeof paymentQrUrl === 'string' &&
    paymentQrUrl.length > 0 &&
    (paymentQrUrl.startsWith('data:image') || paymentQrUrl.startsWith('http'))
  );

  // Load from backend on mount and auto-sync
  useEffect(() => {
    async function loadBackendPaymentQr() {
      try {
        const res = await api.get('/settings/payment-qr');
        if (res.data?.success && res.data?.data) {
          const { payment_qr_url, payment_qr_label, upi_id: bUpi, merchant_name: bMerchant, allow_cash_on_qr: bAllowCash } = res.data.data;
          const localQr = localStorage.getItem('ef_payment_qr_url');

          if (payment_qr_url && typeof payment_qr_url === 'string') {
            setPaymentQrUrl(payment_qr_url);
            localStorage.setItem('ef_payment_qr_url', payment_qr_url);
          } else if (localQr && typeof localQr === 'string' && localQr.startsWith('data:image')) {
            // Local QR exists on phone from previous upload -> auto-sync to backend!
            api.put('/settings/payment-qr', {
              payment_qr_url: localQr,
              payment_qr_label: paymentQrLabel.trim(),
              upi_id: safeUpiId,
              merchant_name: safeMerchant,
              allow_cash_on_qr: allowCashOnQr
            }).catch(() => {});
          }

          if (payment_qr_label && typeof payment_qr_label === 'string') {
            setPaymentQrLabel(payment_qr_label);
            localStorage.setItem('ef_payment_qr_label', payment_qr_label);
          }
          if (bUpi && typeof bUpi === 'string') {
            setUpiId(bUpi);
            localStorage.setItem('ef_upi_id', bUpi);
          }
          if (bMerchant && typeof bMerchant === 'string') {
            setMerchantName(bMerchant);
            localStorage.setItem('ef_merchant_name', bMerchant);
          }
          if (bAllowCash !== undefined) {
            setAllowCashOnQr(Boolean(bAllowCash));
            localStorage.setItem('ef_allow_cash_on_qr', String(bAllowCash));
          }
        }
      } catch (_) {}
    }
    loadBackendPaymentQr();
  }, []);

  // Handle image upload from phone with auto QR decode & auto sync
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      if (typeof base64 === 'string') {
        setPaymentQrUrl(base64);
        localStorage.setItem('ef_payment_qr_url', base64);

        // Try decoding UPI details from image with jsQR
        let extractedUpi = null;
        let extractedMerchant = null;
        try {
          const img = new Image();
          img.src = base64;
          await new Promise(r => { img.onload = r; img.onerror = r; });
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode && qrCode.data) {
            const raw = qrCode.data;
            if (raw.toLowerCase().startsWith('upi://pay')) {
              const queryStr = raw.split('?')[1];
              if (queryStr) {
                const params = new URLSearchParams(queryStr);
                const pa = params.get('pa');
                const pn = params.get('pn');
                if (pa) extractedUpi = decodeURIComponent(pa).trim();
                if (pn) extractedMerchant = decodeURIComponent(pn).trim();
              }
            }
          }
        } catch (_) {}

        const finalUpi = extractedUpi || safeUpiId;
        const finalMerchant = extractedMerchant || safeMerchant;

        if (extractedUpi) {
          setUpiId(extractedUpi);
          localStorage.setItem('ef_upi_id', extractedUpi);
        }
        if (extractedMerchant) {
          setMerchantName(extractedMerchant);
          localStorage.setItem('ef_merchant_name', extractedMerchant);
        }

        // IMMEDIATELY auto-save to backend so new members see it right away!
        try {
          await api.put('/settings/payment-qr', {
            payment_qr_url: base64,
            payment_qr_label: paymentQrLabel.trim(),
            upi_id: finalUpi,
            merchant_name: finalMerchant
          });
          showToast(extractedUpi
            ? `✅ QR Uploaded! Detected UPI ID: ${extractedUpi}`
            : '✅ Custom QR uploaded & synced with member registration!');
        } catch (_) {
          showToast('✅ Custom QR saved locally on device!');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Switch to auto-generated UPI QR
  const handleUseDynamicUpi = () => {
    setPaymentQrUrl('');
    localStorage.removeItem('ef_payment_qr_url');
    api.put('/settings/payment-qr', {
      payment_qr_url: '',
      payment_qr_label: paymentQrLabel.trim(),
      upi_id: safeUpiId,
      merchant_name: safeMerchant
    }).catch(() => {});
    showToast('⚡ Switched to auto-generated dynamic UPI QR!');
  };

  // Save all payment details
  const handleSavePaymentDetails = async () => {
    setSavingPaymentQr(true);

    localStorage.setItem('ef_upi_id', safeUpiId);
    localStorage.setItem('ef_merchant_name', safeMerchant);
    localStorage.setItem('ef_payment_qr_label', paymentQrLabel.trim());
    localStorage.setItem('ef_allow_cash_on_qr', String(allowCashOnQr));
    if (paymentQrUrl) {
      localStorage.setItem('ef_payment_qr_url', paymentQrUrl);
    } else {
      localStorage.removeItem('ef_payment_qr_url');
    }

    try {
      await api.put('/settings/payment-qr', {
        payment_qr_url: paymentQrUrl || '',
        payment_qr_label: paymentQrLabel.trim(),
        upi_id: safeUpiId,
        merchant_name: safeMerchant,
        allow_cash_on_qr: allowCashOnQr
      });
      showToast('✅ Payment & Security settings saved & synced with members!');
    } catch (_) {
      showToast('✅ Saved locally! Members will see this immediately.');
    }

    setSavingPaymentQr(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Clear payment QR
  const handleClearPaymentQR = () => {
    if (!window.confirm('Reset payment settings to dynamic UPI default?')) return;
    setPaymentQrUrl('');
    localStorage.removeItem('ef_payment_qr_url');
    showToast('Reset to dynamic UPI default.');
  };

  const handleCopyUpiId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(safeUpiId);
    }
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
    showToast('📋 UPI ID copied to clipboard!');
  };

  // ─── GENERATE LUXURY PAYMENT STANDEE CANVAS ──────────────────────────────
  const generatePaymentStandeeCanvas = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1450;
    const ctx = canvas.getContext('2d');

    // 1. Dark Luxury Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0B0F17');
    grad.addColorStop(0.5, '#111827');
    grad.addColorStop(1, '#0B0F17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Gold Luxury Border
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#F59E0B';
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.strokeRect(44, 44, canvas.width - 88, canvas.height - 88);

    // 3. Gym Header Emblem
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏋️  ELITE FITNESS CLUB  🏋️', canvas.width / 2, 130);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 58px sans-serif';
    ctx.fillText('CONTACTLESS UPI PAYMENT', canvas.width / 2, 210);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('SCAN WITH ANY UPI APP TO PAY MEMBERSHIP', canvas.width / 2, 260);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px sans-serif';
    ctx.fillText('Google Pay • PhonePe • Paytm • BHIM • Amazon Pay', canvas.width / 2, 305);

    // 4. White Rounded QR Box
    const qrBoxSize = 620;
    const qrBoxX = (canvas.width - qrBoxSize) / 2;
    const qrBoxY = 350;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();

    const qrInnerSize = 520;
    const innerX = (canvas.width - qrInnerSize) / 2;
    const innerY = qrBoxY + (qrBoxSize - qrInnerSize) / 2;

    if (isCustomImage && paymentQrUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = paymentQrUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 800);
        });
        ctx.drawImage(img, innerX, innerY, qrInnerSize, qrInnerSize);
      } catch (_) {
        if (qrCanvasRef.current) {
          ctx.drawImage(qrCanvasRef.current, innerX, innerY, qrInnerSize, qrInnerSize);
        }
      }
    } else if (qrCanvasRef.current) {
      ctx.drawImage(qrCanvasRef.current, innerX, innerY, qrInnerSize, qrInnerSize);
    }

    // 5. Steps below QR
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`⚡ UPI ID: ${safeUpiId}`, canvas.width / 2, 1040);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Payee: ${safeMerchant} • Instant Membership Activation`, canvas.width / 2, 1090);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '20px sans-serif';
    ctx.fillText('After payment, submit the 12-digit UTR number in your app for verification', canvas.width / 2, 1135);

    // 6. Divider & Gym Contact
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 1185);
    ctx.lineTo(canvas.width - 100, 1185);
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Front Desk • Help: 8953933110 • Sector 14, Lucknow', canvas.width / 2, 1235);

    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText('Powered by Elite Fitness Management System', canvas.width / 2, 1295);

    return canvas;
  };

  // ─── DOWNLOAD PAYMENT STANDEE (SAVES DIRECTLY TO STORAGE) ────────────────
  const handleDownloadStandee = async () => {
    setDownloadingStandee(true);
    showToast('⏳ Downloading Payment Standee...');

    try {
      const canvas = await generatePaymentStandeeCanvas();
      const filename = `EliteFitness_UPI_Payment_Standee_${Date.now()}.png`;
      const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

      if (isNative) {
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

        let targetDir = 'Documents';
        try {
          await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });
        } catch (_) {
          await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
          });
          targetDir = 'Phone Storage';
        }

        showToast(`✅ Saved to Phone (${targetDir})!\n${filename}`);
      } else {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('✅ Downloaded UPI Payment Standee!');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Could not complete download. Try print button.');
    } finally {
      setDownloadingStandee(false);
    }
  };

  // ─── SHARE PAYMENT STANDEE (OPENS NATIVE SHARE SHEET) ────────────────────
  const handleShareStandee = async () => {
    setSharingStandee(true);
    showToast('⏳ Opening share options...');

    try {
      const canvas = await generatePaymentStandeeCanvas();
      const filename = `EliteFitness_UPI_Payment_Standee_${Date.now()}.png`;
      const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

      if (isNative) {
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

        let fileUri = null;
        try {
          const res = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
          });
          fileUri = res.uri;
        } catch (_) {
          const docRes = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });
          fileUri = docRes.uri;
        }

        if (fileUri) {
          await Share.share({
            title: 'Elite Fitness UPI Payment Standee',
            text: `Official UPI Payment Standee for ${safeMerchant} (${safeUpiId}). Print and paste on reception desk.`,
            url: fileUri,
            dialogTitle: `Share Standee (${filename})`
          });
        }
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        if (navigator.share) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], filename, { type: 'image/png' });
          await navigator.share({
            title: 'Elite Fitness UPI Payment Standee',
            text: 'Official UPI Payment Standee for reception desk',
            files: [file]
          });
        } else {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('✅ Downloaded standee image to share!');
        }
      }
    } catch (err) {
      if (err?.message !== 'Share canceled' && !err?.name?.includes('AbortError')) {
        showToast('⚠️ Could not open share options.');
      }
    } finally {
      setSharingStandee(false);
    }
  };

  // ─── PRINT PAYMENT STANDEE POPUP ─────────────────────────────────────────
  const handlePrintStandee = async () => {
    const printWin = window.open('', '_blank', 'width=600,height=800');
    if (!printWin) {
      alert('Pop-up blocked! Please allow pop-ups to print payment standee.');
      return;
    }

    const canvas = await generatePaymentStandeeCanvas();
    const dataUrl = canvas.toDataURL('image/png');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Elite Fitness — UPI Payment Standee</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#FFF; padding:20px; }
          img { max-width:100%; height:auto; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.2); }
          @media print { body { padding:0; } img { box-shadow:none; max-width:100%; width:100%; } }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="Elite Fitness Payment Standee" />
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          border: '1.5px solid #F59E0B',
          borderRadius: '12px',
          padding: '12px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.85rem',
          color: '#F9FAFB',
          fontWeight: 700,
          whiteSpace: 'pre-line'
        }}>
          <Sparkles size={18} color="#F59E0B" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden QRCodeCanvas for sharp dynamic UPI QR export (ALWAYS standard UPI URI, never base64) */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <QRCodeCanvas
          ref={qrCanvasRef}
          value={upiUri}
          size={520}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Top Banner */}
      <div className="glass-card" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.9))',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 800, marginBottom: '6px' }}>
              <CreditCard size={14} /> UPI PAYMENT QR SETUP
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#F9FAFB', margin: '0 0 4px 0' }}>
              UPI Payment Desk & Counter Standee
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>
              Configure your official UPI ID and generate printable payment standees for members to scan & pay.
            </p>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', fontSize: '0.78rem', fontWeight: 800 }}>
            <ShieldCheck size={16} /> LIVE IN REGISTRATION & RENEWALS
          </div>
        </div>
      </div>

      {/* Two Column Layout: Setup on Left, Live Standee on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>

        {/* Left Column: UPI Configuration Form */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} /> UPI Account Details
          </h3>

          <div>
            <label className="label">Your UPI ID (VPA) *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 8953933110@paytm or elitefitness@okaxis"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleCopyUpiId}
              >
                {copiedUpi ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                {copiedUpi ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
              Members scanning the QR will transfer fees directly to this UPI ID.
            </div>

            {/* Quick 1-tap Bank Handle Selector */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', alignSelf: 'center', marginRight: '2px' }}>Presets:</span>
              {[
                { label: 'PhonePe (@ybl)', val: '8953933110@ybl' },
                { label: 'GPay (@okhdfcbank)', val: '8953933110@okhdfcbank' },
                { label: 'GPay (@okaxis)', val: '8953933110@okaxis' },
                { label: 'GPay (@oksbi)', val: '8953933110@oksbi' },
                { label: 'Paytm (@paytm)', val: '8953933110@paytm' },
              ].map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => {
                    setUpiId(p.val);
                    localStorage.setItem('ef_upi_id', p.val);
                    api.put('/settings/payment-qr', {
                      payment_qr_url: paymentQrUrl || '',
                      payment_qr_label: paymentQrLabel.trim(),
                      upi_id: p.val,
                      merchant_name: safeMerchant
                    }).catch(() => {});
                    showToast(`⚡ Set UPI ID to: ${p.val}`);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    borderRadius: '6px',
                    background: upiId === p.val ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.06)',
                    border: upiId === p.val ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.12)',
                    color: upiId === p.val ? '#F59E0B' : '#CBD5E1',
                    cursor: 'pointer',
                    fontWeight: upiId === p.val ? 800 : 500
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Payee / Merchant Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Elite Fitness Club"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Standee Title / Custom Instruction</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Scan to Pay Membership Fee • Instant UTR Verification"
              value={paymentQrLabel}
              onChange={(e) => setPaymentQrLabel(e.target.value)}
            />
          </div>

          {/* QR Mode Switcher */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F9FAFB', marginBottom: '8px' }}>
              QR Code Mode
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={handleUseDynamicUpi}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: !isCustomImage ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                  background: !isCustomImage ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: !isCustomImage ? '#F59E0B' : '#9CA3AF',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ⚡ Dynamic UPI QR
              </button>

              <label style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                border: isCustomImage ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                background: isCustomImage ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                color: isCustomImage ? '#F59E0B' : '#9CA3AF',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center',
                display: 'inline-block'
              }}>
                📁 Upload Custom QR
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', lineHeight: 1.5 }}>
              {!isCustomImage ? (
                <span>
                  🟢 <strong>Dynamic UPI QR active:</strong> Automatically embeds your UPI ID ({safeUpiId}). Any app (GPay, PhonePe, Paytm) opens with payment ready!
                </span>
              ) : (
                <span>
                  🖼️ <strong>Custom QR active:</strong> Using your uploaded merchant sticker image.
                </span>
              )}
            </div>
          </div>

          {/* Public Registration Cash Security Card */}
          <div style={{
            background: allowCashOnQr ? 'rgba(245, 158, 11, 0.06)' : 'rgba(16, 185, 129, 0.06)',
            border: `1.5px solid ${allowCashOnQr ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color={allowCashOnQr ? '#F59E0B' : '#10B981'} />
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#F9FAFB' }}>
                  Public QR Cash Security
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={allowCashOnQr}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAllowCashOnQr(val);
                    localStorage.setItem('ef_allow_cash_on_qr', String(val));
                    api.put('/settings/payment-qr', {
                      payment_qr_url: paymentQrUrl,
                      payment_qr_label: paymentQrLabel.trim(),
                      upi_id: safeUpiId,
                      merchant_name: safeMerchant,
                      allow_cash_on_qr: val
                    }).catch(() => {});
                    showToast(val ? '⚠️ Cash option enabled on QR (Requires cash verification at desk)' : '🔒 Cash disabled on QR. Members must pay online via UPI.');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: '#F59E0B', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: allowCashOnQr ? '#F59E0B' : '#10B981' }}>
                  {allowCashOnQr ? 'ENABLED' : 'DISABLED (Recommended)'}
                </span>
              </label>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#CBD5E1', lineHeight: 1.45 }}>
              {allowCashOnQr ? (
                <span>
                  ⚠️ <strong>Cash option allowed on QR portal:</strong> Members can submit details with "Cash at Reception". Their membership will remain strictly <strong>INACTIVE</strong> until verified & paid at the counter.
                </span>
              ) : (
                <span>
                  🛡️ <strong>Airtight Security Active:</strong> Members scanning the registration QR can <strong>ONLY pay online via UPI</strong> with 12-digit UTR verification. No unpaid registrations allowed.
                </span>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn-primary"
              style={{
                flex: 1,
                padding: '12px 20px',
                fontWeight: 900,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: savedSuccess
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #F59E0B, #D97706)'
              }}
              onClick={handleSavePaymentDetails}
              disabled={savingPaymentQr}
            >
              {savedSuccess ? (
                <><Check size={18} /> Settings Saved & Synced!</>
              ) : savingPaymentQr ? (
                <>⏳ Saving Settings...</>
              ) : (
                <><Check size={18} /> Save Payment Settings</>
              )}
            </button>

            {isCustomImage && (
              <button
                type="button"
                onClick={handleClearPaymentQR}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Standee Card */}
        <div className="glass-card" style={{
          padding: '24px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          border: '2px solid #F59E0B',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            💳 RECEPTION PAYMENT STANDEE
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '0.72rem', margin: '0 0 16px 0' }}>
            Live preview of the standee poster for your gym front desk
          </p>

          {/* White Card holding the sharp QR */}
          <div style={{
            background: '#FFFFFF',
            padding: '16px',
            borderRadius: '18px',
            display: 'inline-block',
            boxShadow: '0 12px 32px rgba(245, 158, 11, 0.25), 0 0 0 2px rgba(245, 158, 11, 0.35)',
            marginBottom: '14px'
          }}>
            {isCustomImage ? (
              <img
                src={paymentQrUrl}
                alt="Custom Payment QR"
                style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: '8px' }}
                onError={() => setPaymentQrUrl('')}
              />
            ) : (
              <QRCodeSVG
                value={upiUri}
                size={180}
                level="H"
                includeMargin={false}
              />
            )}
          </div>

          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#F8FAFC', marginBottom: '2px' }}>
            {safeMerchant}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 800, marginBottom: '6px' }}>
            UPI ID: {safeUpiId}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '14px' }}>
            Accepted: Google Pay • PhonePe • Paytm • BHIM • UPI
          </div>

          {/* Standee Action Buttons: Download, Share, Print */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 800
                }}
                onClick={handleDownloadStandee}
                disabled={downloadingStandee}
              >
                <Download size={16} />
                {downloadingStandee ? 'Saving...' : 'Download'}
              </button>

              <button
                type="button"
                style={{
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
                onClick={handleShareStandee}
                disabled={sharingStandee}
              >
                <Share2 size={16} />
                {sharingStandee ? 'Sharing...' : 'Share'}
              </button>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handlePrintStandee}
            >
              <Printer size={14} /> Print Desk Standee
            </button>
          </div>

          <div style={{ marginTop: '12px', fontSize: '0.68rem', color: '#64748B', lineHeight: 1.5 }}>
            💡 Paste on reception counter so members can scan, pay, and submit UTR for instant verification.
          </div>
        </div>
      </div>
    </div>
  );
}
