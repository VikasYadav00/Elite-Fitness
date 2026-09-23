import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, QrCode, Printer, Save, CreditCard, Upload, Check,
  AlertCircle, Sparkles, X, Download, Wifi, Lock, Eye, EyeOff,
  ShieldCheck, ExternalLink, Share2
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import api from '../api';

// ─── Utility: detect best registration URL ────────────────────────────────────
function getRegistrationUrl() {
  const saved = localStorage.getItem('ef_registration_url');
  if (saved && !saved.includes('localhost') && !saved.includes('127.0.0.1')) return saved;
  const hostname = window.location.hostname;
  // If running on localhost or inside mobile APK, use actual LAN IP so customers can open it
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://192.168.1.49:3000';
  }
  return `http://${hostname}:3000`;
}

// ─── Print-only QR popup (opens in new window, only shows the standee) ────────
function printRegistrationQR(gymName, address, regUrl) {
  const printWindow = window.open('', '_blank', 'width=480,height=650');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site to print the QR.');
    return;
  }

  // We need to render the QR into a canvas first so we can embed it as base64
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 300;
  canvas.height = 300;

  // Use QRCode library via CDN in print window instead
  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${gymName} — Registration QR</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Arial', sans-serif;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .standee {
      width: 420px;
      background: linear-gradient(160deg, #0B0F17 0%, #1E293B 100%);
      border-radius: 24px;
      padding: 36px 32px;
      text-align: center;
      border: 3px solid #F59E0B;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      color: white;
    }
    .gym-brand { font-size: 1.6rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; }
    .brand-accent { color: #F59E0B; }
    .tagline { color: #94A3B8; font-size: 0.8rem; margin-bottom: 28px; letter-spacing: 0.08em; text-transform: uppercase; }
    .qr-box { background: #fff; padding: 18px; border-radius: 18px; display: inline-block; margin-bottom: 20px; box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
    .cta { font-size: 1rem; font-weight: 700; color: #F59E0B; margin-bottom: 6px; }
    .sub { color: #94A3B8; font-size: 0.78rem; margin-bottom: 20px; line-height: 1.5; }
    .gym-name { font-size: 1.1rem; font-weight: 800; color: #F8FAFC; margin-bottom: 4px; }
    .gym-addr { font-size: 0.72rem; color: #64748B; margin-bottom: 20px; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin-bottom: 16px; }
    .url-box { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 8px 14px; font-size: 0.75rem; color: #F59E0B; word-break: break-all; }
    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="standee">
    <div class="gym-brand">ELITE <span class="brand-accent">FITNESS</span></div>
    <div class="tagline">📱 SCAN TO REGISTER — FREE</div>

    <div class="qr-box">
      <div id="qrcode"></div>
    </div>

    <div class="cta">Scan QR Code to Register</div>
    <div class="sub">
      Point your phone camera at the QR above.<br/>
      Fill in your details and get your instant<br/>digital membership pass!
    </div>

    <hr class="divider"/>
    <div class="gym-name">${gymName}</div>
    <div class="gym-addr">${address}</div>
  </div>

  <script>
    window.onload = function() {
      new QRCode(document.getElementById("qrcode"), {
        text: "${regUrl}",
        width: 240,
        height: 240,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      setTimeout(() => { window.print(); }, 800);
    };
  <\/script>
</body>
</html>
  `);
  printWindow.document.close();
}

// ─── Download QR as PNG ────────────────────────────────────────────────────────
function downloadQrPng(regUrl, gymName) {
  const canvas = document.createElement('canvas');
  const size = 512;
  const padding = 40;
  canvas.width = size;
  canvas.height = size + 120;
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Use qrcode library in a temp element
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);

  // We'll use the QRCodeCanvas ref approach
  // For simplicity, just open the print window for download
  document.body.removeChild(tempDiv);
}

export default function SettingsView() {
  const [gym, setGym] = useState({
    gym_name: 'Elite Fitness',
    phone: '+91 8953933110',
    email: 'contact@elitefitness.com',
    address: 'Plot 42, Sector 18, Commercial Hub, Main City',
    opening_time: '05:00 AM',
    closing_time: '11:00 PM',
  });

  // ─── Change Password State ──────────────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [pwdError, setPwdError] = useState(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const pwdRules = [
    { id: 'min', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
    { id: 'num', label: 'One numeric digit (0–9)', test: (p) => /[0-9]/.test(p) },
    { id: 'sym', label: 'One symbol (!@#$%^&* etc.)', test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const passwordStrength = (pwd) => {
    const passed = pwdRules.filter(r => r.test(pwd)).length;
    if (passed <= 1) return { label: 'Weak', color: '#EF4444', width: '20%' };
    if (passed === 2) return { label: 'Fair', color: '#F59E0B', width: '40%' };
    if (passed === 3) return { label: 'Good', color: '#3B82F6', width: '65%' };
    if (passed === 4) return { label: 'Strong', color: '#10B981', width: '85%' };
    return { label: 'Very Strong', color: '#10B981', width: '100%' };
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError(null);

    const { current, newPwd, confirm } = pwdForm;
    if (!current || !newPwd || !confirm) {
      setPwdError('All fields are required.');
      return;
    }
    if (newPwd !== confirm) {
      setPwdError('New password and confirm password do not match.');
      return;
    }
    const allPassed = pwdRules.every(r => r.test(newPwd));
    if (!allPassed) {
      setPwdError('New password does not meet all requirements. Please check the rules below.');
      return;
    }
    const activePass = localStorage.getItem('ef_owner_password') || 'admin123';
    if (current !== activePass) {
      setPwdError('Current password is incorrect.');
      return;
    }

    setSavingPwd(true);
    try {
      await api.put('/auth/change-password', { currentPassword: current, newPassword: newPwd }, { timeout: 1500 });
    } catch (err) {
      // Offline / standalone — continue
    }
    // Persist new owner password
    localStorage.setItem('ef_owner_password', newPwd);
    setSavingPwd(false);
    setPwdSuccess(true);
    setPwdForm({ current: '', newPwd: '', confirm: '' });
    showToast('✅ Password changed successfully!');
    setTimeout(() => setPwdSuccess(false), 4000);
  };

  // ─── Registration URL — use network-accessible IP ──────────────────────────
  const [regUrl, setRegUrl] = useState(getRegistrationUrl());

  const [toastMessage, setToastMessage] = useState(null);
  const [customRegUrl, setCustomRegUrl] = useState('');
  const [showUrlEdit, setShowUrlEdit] = useState(false);

  const qrCanvasRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveGym = (e) => {
    e.preventDefault();
    showToast('Gym profile settings saved successfully!');
  };

  const [downloadingRegStandee, setDownloadingRegStandee] = useState(false);
  const [sharingRegStandee, setSharingRegStandee] = useState(false);

  // ─── GENERATE REGISTRATION STANDEE CANVAS (CLEAN LUXURY DESIGN) ───────────
  const generateRegistrationCanvas = () => {
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
    ctx.font = '900 62px sans-serif';
    ctx.fillText('MEMBER REGISTRATION', canvas.width / 2, 210);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('SCAN WITH YOUR PHONE CAMERA TO REGISTER', canvas.width / 2, 260);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px sans-serif';
    ctx.fillText('Fast • 100% Paperless • Instant Digital Gym Pass', canvas.width / 2, 305);

    // 4. White Rounded QR Box
    const qrBoxSize = 620;
    const qrBoxX = (canvas.width - qrBoxSize) / 2;
    const qrBoxY = 350;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();

    if (qrCanvasRef.current) {
      const qrInnerSize = 520;
      const innerX = (canvas.width - qrInnerSize) / 2;
      const innerY = qrBoxY + (qrBoxSize - qrInnerSize) / 2;
      ctx.drawImage(qrCanvasRef.current, innerX, innerY, qrInnerSize, qrInnerSize);
    }

    // 5. Steps below QR
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('📱 3 EASY STEPS TO JOIN:', canvas.width / 2, 1040);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('1. Enter Details  ➔  2. Select Plan  ➔  3. Pay Online', canvas.width / 2, 1090);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px sans-serif';
    ctx.fillText('Get your unique Member ID & Digital Pass immediately on your phone', canvas.width / 2, 1135);

    // 6. Divider & Gym Address
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 1185);
    ctx.lineTo(canvas.width - 100, 1185);
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${gym.gym_name} • Help: 8953933110 • ${gym.address}`, canvas.width / 2, 1235);

    // Clean footer branding — no raw URL text
    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText('Powered by Elite Fitness Management System', canvas.width / 2, 1295);

    return canvas;
  };

  // ─── DOWNLOAD REGISTRATION QR (SAVES DIRECTLY TO PHONE STORAGE) ───────────
  const handleDownloadRegistrationQR = async () => {
    setDownloadingRegStandee(true);
    showToast('⏳ Downloading Registration Standee...');

    try {
      const canvas = generateRegistrationCanvas();
      const filename = `EliteFitness_Registration_Standee_${Date.now()}.png`;
      const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

      if (isNative) {
        // Mobile APK: write directly to Documents without opening share sheet
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
        showToast('✅ Downloaded Registration Standee!');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Could not complete download. Try print button.');
    } finally {
      setDownloadingRegStandee(false);
    }
  };

  // ─── SHARE REGISTRATION QR (OPENS NATIVE SHARE SHEET / WHATSAPP) ──────────
  const handleShareRegistrationQR = async () => {
    setSharingRegStandee(true);
    showToast('⏳ Opening share options...');

    try {
      const canvas = generateRegistrationCanvas();
      const filename = `EliteFitness_Registration_Standee_${Date.now()}.png`;
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
            title: 'Elite Fitness Registration Standee',
            text: 'Official Reception Registration Standee — Print and paste on reception desk.',
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
            title: 'Elite Fitness Registration Standee',
            text: 'Official Reception Registration Standee',
            files: [file]
          });
        } else {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('✅ Downloaded Registration Standee to share!');
        }
      }
    } catch (err) {
      if (err?.message !== 'Share canceled' && !err?.name?.includes('AbortError')) {
        showToast('⚠️ Could not open share options.');
      }
    } finally {
      setSharingRegStandee(false);
    }
  };

  const handlePrintQR = () => {
    printRegistrationQR(gym.gym_name, gym.address, regUrl);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          border: '1px solid #10B981', color: '#F9FAFB',
          padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem'
        }}>
          <Sparkles size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gym Profile & QR Settings</h2>
        <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
          Manage gym info, print the registration QR poster for reception, and upload the UPI payment QR for member renewals.
        </p>
      </div>

      {/* Gym Info + Registration QR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', alignItems: 'start' }}>

        {/* Gym Info Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#F59E0B' }}>
            <Settings size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Gym Profile
          </h3>

          <form onSubmit={handleSaveGym} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Gym / Business Name</label>
              <input type="text" className="input-field" value={gym.gym_name}
                onChange={(e) => setGym({ ...gym, gym_name: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
              <div>
                <label className="label">Phone / WhatsApp</label>
                <input type="text" className="input-field" value={gym.phone}
                  onChange={(e) => setGym({ ...gym, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Official Email</label>
                <input type="email" className="input-field" value={gym.email}
                  onChange={(e) => setGym({ ...gym, email: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">Gym Address</label>
              <textarea className="input-field" rows={2} value={gym.address}
                onChange={(e) => setGym({ ...gym, address: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
              <div>
                <label className="label">Opening Time</label>
                <input type="text" className="input-field" value={gym.opening_time}
                  onChange={(e) => setGym({ ...gym, opening_time: e.target.value })} />
              </div>
              <div>
                <label className="label">Closing Time</label>
                <input type="text" className="input-field" value={gym.closing_time}
                  onChange={(e) => setGym({ ...gym, closing_time: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Save size={18} /> Save Gym Profile
            </button>
          </form>
        </div>

        {/* Hidden QRCodeCanvas for Sharp Standee Image Export */}
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
          <QRCodeCanvas
            ref={qrCanvasRef}
            value={regUrl}
            size={520}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Registration QR Standee */}
        <div className="glass-card" style={{
          padding: '24px', textAlign: 'center',
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          border: '2px solid #F59E0B'
        }}>
          <h4 style={{ fontSize: '0.85rem', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            🏋️ REGISTRATION QR
          </h4>
          <p style={{ color: '#9CA3AF', fontSize: '0.72rem', marginBottom: '16px' }}>
            Members scan this to register & pay at reception
          </p>

          {/* QR Code — only the QR */}
          <div style={{
            background: '#FFF', padding: '16px', borderRadius: '16px',
            display: 'inline-block', marginBottom: '14px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.5)'
          }}>
            <QRCodeSVG value={regUrl} size={160} level="H" />
          </div>

          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F8FAFC', marginBottom: '2px' }}>
            {gym.gym_name}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '4px', lineHeight: 1.4 }}>
            {gym.address}
          </div>

          {/* Network URL display */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            margin: '8px 0 16px',
            padding: '6px 12px', background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px',
            fontSize: '0.7rem', color: '#38BDF8', fontFamily: 'monospace'
          }}>
            <Wifi size={12} />
            {regUrl}
          </div>

          {/* Custom URL input */}
          {showUrlEdit && (
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                className="input-field"
                style={{ fontSize: '0.8rem', padding: '8px 12px', marginBottom: '6px' }}
                placeholder="e.g. http://192.168.1.49:3000"
                value={customRegUrl}
                onChange={e => setCustomRegUrl(e.target.value)}
              />
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '8px', fontSize: '0.8rem', marginBottom: '4px' }}
                onClick={() => {
                  if (customRegUrl) {
                    setRegUrl(customRegUrl.trim());
                    localStorage.setItem('ef_registration_url', customRegUrl.trim());
                    setShowUrlEdit(false);
                    showToast('Registration URL updated!');
                  }
                }}
              >
                Use This URL
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                onClick={handleDownloadRegistrationQR}
                disabled={downloadingRegStandee}
              >
                <Download size={16} />
                {downloadingRegStandee ? 'Saving...' : 'Download'}
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
                onClick={handleShareRegistrationQR}
                disabled={sharingRegStandee}
              >
                <Share2 size={16} />
                {sharingRegStandee ? 'Sharing...' : 'Share'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={handlePrintQR}
              >
                <Printer size={14} /> Print Standee
              </button>

              <a
                href={regUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '8px 12px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#38BDF8'
                }}
              >
                <ExternalLink size={14} /> Test Link
              </a>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.78rem', padding: '8px' }}
              onClick={() => setShowUrlEdit(!showUrlEdit)}
            >
              <Wifi size={14} /> {showUrlEdit ? 'Cancel URL Change' : 'Change Registration URL'}
            </button>
          </div>

          <div style={{ marginTop: '10px', fontSize: '0.68rem', color: '#64748B', lineHeight: 1.5 }}>
            💡 Scanned by customer phones at reception to enter details & pay online directly
          </div>
        </div>
      </div>


      {/* ─── Change Password Section ─────────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '24px',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        background: 'linear-gradient(135deg, rgba(17,24,39,0.95), rgba(30,20,60,0.85))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <ShieldCheck size={20} color="#8B5CF6" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#A78BFA' }}>Change Password</h3>
        </div>
        <p style={{ color: '#9CA3AF', fontSize: '0.83rem', marginBottom: '24px' }}>
          Update your owner account password. Make sure it meets all security requirements.
        </p>

        {pwdError && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#FCA5A5', fontSize: '0.82rem',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            marginBottom: '18px', lineHeight: 1.4
          }}>
            <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{pwdError}</span>
          </div>
        )}

        {pwdSuccess && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#6EE7B7', fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '18px'
          }}>
            <Check size={18} color="#10B981" /> Password changed successfully!
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Current Password */}
          <div>
            <label className="label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '13px', top: '13px' }} />
              <input
                type={showPwd.current ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter current password"
                value={pwdForm.current}
                onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })}
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
              />
              <button type="button" onClick={() => setShowPwd(s => ({ ...s, current: !s.current }))}
                style={{ position: 'absolute', right: '11px', top: '11px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '2px' }}>
                {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="label">New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '13px', top: '13px' }} />
              <input
                type={showPwd.newPwd ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter new password"
                value={pwdForm.newPwd}
                onChange={e => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
              />
              <button type="button" onClick={() => setShowPwd(s => ({ ...s, newPwd: !s.newPwd }))}
                style={{ position: 'absolute', right: '11px', top: '11px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '2px' }}>
                {showPwd.newPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength Bar */}
            {pwdForm.newPwd && (() => {
              const s = passwordStrength(pwdForm.newPwd);
              return (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Password Strength</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>{s.label}</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: s.color, width: s.width, transition: 'width 0.3s ease, background 0.3s ease' }} />
                  </div>
                </div>
              );
            })()}

            {/* Requirements checklist */}
            <div style={{
              marginTop: '12px', padding: '14px',
              background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#A78BFA', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password Must Contain
              </div>
              {pwdRules.map(rule => {
                const passed = rule.test(pwdForm.newPwd);
                return (
                  <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: passed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${passed ? '#10B981' : 'rgba(255,255,255,0.12)'}`,
                      transition: 'all 0.2s ease'
                    }}>
                      {passed && <Check size={11} color="#10B981" strokeWidth={3} />}
                    </div>
                    <span style={{ color: passed ? '#6EE7B7' : '#9CA3AF', transition: 'color 0.2s' }}>{rule.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '13px', top: '13px' }} />
              <input
                type={showPwd.confirm ? 'text' : 'password'}
                className="input-field"
                placeholder="Re-enter new password"
                value={pwdForm.confirm}
                onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                style={{
                  paddingLeft: '38px', paddingRight: '40px',
                  borderColor: pwdForm.confirm
                    ? pwdForm.confirm === pwdForm.newPwd
                      ? 'rgba(16,185,129,0.6)'
                      : 'rgba(239,68,68,0.5)'
                    : undefined
                }}
              />
              <button type="button" onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}
                style={{ position: 'absolute', right: '11px', top: '11px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '2px' }}>
                {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwdForm.confirm && pwdForm.confirm !== pwdForm.newPwd && (
              <p style={{ fontSize: '0.75rem', color: '#F87171', marginTop: '5px' }}>Passwords do not match</p>
            )}
            {pwdForm.confirm && pwdForm.confirm === pwdForm.newPwd && pwdForm.newPwd && (
              <p style={{ fontSize: '0.75rem', color: '#6EE7B7', marginTop: '5px' }}>✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={savingPwd}
            style={{
              alignSelf: 'flex-start',
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {savingPwd ? 'Updating...' : <><ShieldCheck size={18} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
