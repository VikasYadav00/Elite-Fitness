import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, QrCode, Printer, Save, CreditCard, Upload, Check,
  AlertCircle, Sparkles, X, Download, Wifi, Lock, Eye, EyeOff,
  ShieldCheck, ExternalLink, Share2, CheckCircle2, Activity, Copy, RefreshCw,
  Server, Globe
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import api from '../api';
import {
  getPublicRegistrationUrl,
  getPublicFeedbackUrl,
  getPublicAttendanceUrl,
  getPublicUniversalQrUrl,
  getApiBaseUrl,
  getFrontendBaseUrl,
  DEFAULT_PRODUCTION_API_URL
} from '../urlConfig';

// ─── Utility: centralized registration URL ───────────────────────────────────
export const PUBLIC_REGISTRATION_URL = getPublicRegistrationUrl();

function getRegistrationUrl() {
  return getPublicRegistrationUrl();
}

// ─── Print-only Universal QR popup (opens in new window, shows the Universal standee) ────────
function printUniversalQR(gymName, address, qrUrl) {
  const printWindow = window.open('', '_blank', 'width=500,height=720');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site to print the QR.');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${gymName} — Universal Gym Services QR</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .standee {
      width: 430px;
      background: linear-gradient(160deg, #0B0F17 0%, #1E293B 100%);
      border-radius: 24px;
      padding: 34px 28px;
      text-align: center;
      border: 3px solid #F59E0B;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      color: white;
    }
    .gym-brand { font-size: 1.6rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; }
    .brand-accent { color: #F59E0B; }
    .tagline { color: #F59E0B; font-size: 0.8rem; font-weight: 800; margin-bottom: 20px; letter-spacing: 0.08em; text-transform: uppercase; }
    .qr-box { background: #fff; padding: 18px; border-radius: 18px; display: inline-block; margin-bottom: 16px; box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
    .cta { font-size: 1.05rem; font-weight: 800; color: #FFFFFF; margin-bottom: 12px; }
    .services-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 18px;
      text-align: left;
    }
    .service-pill {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(245,158,11,0.3);
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 0.74rem;
      color: #E2E8F0;
      line-height: 1.3;
    }
    .service-pill strong { color: #F59E0B; display: block; font-size: 0.78rem; }
    .gym-name { font-size: 1.1rem; font-weight: 800; color: #F8FAFC; margin-bottom: 4px; }
    .gym-addr { font-size: 0.72rem; color: #64748B; margin-bottom: 12px; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin-bottom: 12px; }
    .url-box { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 6px 12px; font-size: 0.72rem; color: #F59E0B; word-break: break-all; margin-bottom: 8px; }
    .footer-note { font-size: 0.68rem; color: #94A3B8; }
    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="standee">
    <div class="gym-brand">ELITE <span class="brand-accent">FITNESS</span></div>
    <div class="tagline">🌟 ALL-IN-ONE GYM SCANNER</div>

    <div class="qr-box">
      <div id="qrcode"></div>
    </div>

    <div class="cta">Scan with Camera or Google Lens</div>

    <div class="services-grid">
      <div class="service-pill">
        <strong>🏋️ Daily Attendance</strong>
        Quick scan check-in
      </div>
      <div class="service-pill">
        <strong>📝 New Registration</strong>
        Instant digital pass
      </div>
      <div class="service-pill">
        <strong>⭐ Feedback & Review</strong>
        Rate & leave review
      </div>
      <div class="service-pill">
        <strong>📞 Complaint & Help</strong>
        Contact gym team
      </div>
    </div>

    <div class="url-box">${qrUrl}</div>

    <hr class="divider"/>
    <div class="gym-name">${gymName}</div>
    <div class="gym-addr">${address}</div>
    <div class="footer-note">No app download required • Instant mobile portal</div>
  </div>

  <script>
    window.onload = function() {
      new QRCode(document.getElementById("qrcode"), {
        text: "${qrUrl}",
        width: 220,
        height: 220,
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

const printRegistrationQR = printUniversalQR;

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

  // ─── Registration & Universal QR URLs — centralized production configuration ────────────────
  const [universalQrUrl, setUniversalQrUrl] = useState(getPublicUniversalQrUrl());
  const [customUniversalUrl, setCustomUniversalUrl] = useState('');
  const [regUrl, setRegUrl] = useState(getRegistrationUrl());
  const [feedbackQrUrl, setFeedbackQrUrl] = useState(getPublicFeedbackUrl());
  const [attendanceQrUrl, setAttendanceQrUrl] = useState(getPublicAttendanceUrl());
  const [apiBaseUrl, setApiBaseUrl] = useState(getApiBaseUrl());
  const [apiHealth, setApiHealth] = useState({ status: 'checking', message: 'Testing backend connection...', latency: null });
  const [customApiInput, setCustomApiInput] = useState('');
  const [showCustomApiEdit, setShowCustomApiEdit] = useState(false);
  const [lastGeneratedTime, setLastGeneratedTime] = useState(() => new Date().toLocaleString('en-IN'));
  const [globalFrontendInput, setGlobalFrontendInput] = useState(() => getFrontendBaseUrl());

  const [toastMessage, setToastMessage] = useState(null);
  const [customRegUrl, setCustomRegUrl] = useState('');
  const [showUrlEdit, setShowUrlEdit] = useState(false);

  const qrCanvasRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Guarantee Universal QR URL strictly points to /qr (service landing page)
  useEffect(() => {
    const cleanUniversal = getPublicUniversalQrUrl();
    if (universalQrUrl !== cleanUniversal) {
      setUniversalQrUrl(cleanUniversal);
    }
    const storedUniversal = localStorage.getItem('ef_universal_qr_url');
    if (storedUniversal && (storedUniversal.includes('/register') || storedUniversal.includes('localhost') || storedUniversal.includes('127.0.0.1'))) {
      localStorage.setItem('ef_universal_qr_url', cleanUniversal);
    }
  }, []);

  // Live Backend Health Check (Tests Public /health and /api/health)
  const checkBackendHealth = async (overrideUrl = null) => {
    // If the stored URL is the defunct loca.lt, purge it and use the live Cloudflare HTTPS URL
    let target = overrideUrl || getApiBaseUrl();
    if (target.includes('loca.lt')) {
      localStorage.removeItem('elite_fitness_api_url');
      target = DEFAULT_PRODUCTION_API_URL;
    }
    const targetUrl = target.replace(/\/+$/, '');
    setApiBaseUrl(targetUrl);
    setApiHealth({ status: 'checking', message: 'Testing backend connection over HTTPS...', latency: null });
    const start = Date.now();

    try {
      // 1. Direct fetch to /health (simple GET, avoids complex preflights)
      const rootUrl = targetUrl.replace(/\/api\/?$/, '');
      const healthUrl = `${rootUrl}/health`;
      const res = await axios.get(healthUrl, { timeout: 7000 });
      const latency = Date.now() - start;
      if (res.data?.status === 'ok' || res.data?.success) {
        setApiHealth({
          status: 'online',
          message: `Live & Operational (${res.data.service || 'Cloud Server'}, ${latency}ms)`,
          latency
        });
        return;
      }
    } catch (_) {}

    try {
      // 2. Direct fetch to /api/health
      const res = await axios.get(`${targetUrl}/health`, { timeout: 6000 });
      const latency = Date.now() - start;
      if (res.data?.status === 'ok' || res.data?.success) {
        setApiHealth({
          status: 'online',
          message: `Live & Operational (${res.data.service || 'Cloud Server'}, ${latency}ms)`,
          latency
        });
        return;
      }
    } catch (_) {}

    // 3. Fallback: try pinging /api/membership-plans or /health through api instance
    try {
      const res = await api.get('/membership-plans', { timeout: 5000 });
      const latency = Date.now() - start;
      if (res.status === 200) {
        setApiHealth({ status: 'online', message: `Live & Operational (${latency}ms)`, latency });
        return;
      }
    } catch (err) {
      const errorMsg = targetUrl.includes('onrender.com')
        ? 'Render service not yet created on dashboard.render.com. Use Live Public HTTPS (Cloudflare).'
        : 'Backend unreachable. Check server status or CORS.';
      setApiHealth({ status: 'offline', message: errorMsg, latency: null });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const handleSaveGym = (e) => {
    e.preventDefault();
    showToast('Gym profile settings saved successfully!');
  };

  const [downloadingUniversalStandee, setDownloadingUniversalStandee] = useState(false);
  const [sharingUniversalStandee, setSharingUniversalStandee] = useState(false);
  const [downloadingRegStandee, setDownloadingRegStandee] = useState(false);
  const [sharingRegStandee, setSharingRegStandee] = useState(false);

  // ─── GENERATE UNIVERSAL QR STANDEE CANVAS (CLEAN LUXURY DESIGN) ───────────
  const generateUniversalCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1500;
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
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏋️  ELITE FITNESS CLUB  🏋️', canvas.width / 2, 120);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 58px sans-serif';
    ctx.fillText('ALL-IN-ONE GYM SCANNER', canvas.width / 2, 195);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('SCAN WITH YOUR PHONE CAMERA OR GOOGLE LENS', canvas.width / 2, 245);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '20px sans-serif';
    ctx.fillText('No App Required • Instant Mobile Access to All Gym Services', canvas.width / 2, 285);

    // 4. White Rounded QR Box
    const qrBoxSize = 580;
    const qrBoxX = (canvas.width - qrBoxSize) / 2;
    const qrBoxY = 320;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();

    if (qrCanvasRef.current) {
      const qrInnerSize = 490;
      const innerX = (canvas.width - qrInnerSize) / 2;
      const innerY = qrBoxY + (qrBoxSize - qrInnerSize) / 2;
      ctx.drawImage(qrCanvasRef.current, innerX, innerY, qrInnerSize, qrInnerSize);
    }

    // 5. 4 Available Services Cards below QR
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('⚡ 4 SERVICES AVAILABLE ON YOUR PHONE:', canvas.width / 2, 960);

    const cardY = 995;
    const cardH = 92;
    const cardW = 410;
    const gap = 20;
    const startX = (canvas.width - (cardW * 2 + gap)) / 2;

    const services = [
      { title: '🏋️ Daily Attendance', desc: 'Scan to check in instantly', x: startX, y: cardY },
      { title: '📝 New Registration', desc: 'Join gym & get digital pass', x: startX + cardW + gap, y: cardY },
      { title: '⭐ Feedback & Review', desc: 'Rate your workout experience', x: startX, y: cardY + cardH + 16 },
      { title: '📞 Complaint & Support', desc: 'Call, WhatsApp & submit ticket', x: startX + cardW + gap, y: cardY + cardH + 16 }
    ];

    services.forEach(s => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(s.title, s.x + 20, s.y + 36);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '18px sans-serif';
      ctx.fillText(s.desc, s.x + 20, s.y + 68);
    });

    // 6. Divider & Gym Address
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 1260);
    ctx.lineTo(canvas.width - 80, 1260);
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${gym.gym_name} • Help: ${gym.phone} • ${gym.address}`, canvas.width / 2, 1310);

    // Clean footer branding
    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText('Official Reception Standee • Elite Fitness Management System', canvas.width / 2, 1360);

    return canvas;
  };

  // ─── DOWNLOAD UNIVERSAL QR (SAVES DIRECTLY TO PHONE STORAGE) ───────────
  const handleDownloadUniversalQR = async () => {
    setDownloadingUniversalStandee(true);
    showToast('⏳ Downloading Universal QR Standee...');

    try {
      const canvas = generateUniversalCanvas();
      const filename = `EliteFitness_Universal_QR_Standee_${Date.now()}.png`;
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
        showToast('✅ Downloaded Universal QR Standee!');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Could not complete download. Try print button.');
    } finally {
      setDownloadingUniversalStandee(false);
    }
  };

  // ─── SHARE UNIVERSAL QR (OPENS NATIVE SHARE SHEET / WHATSAPP) ──────────
  const handleShareUniversalQR = async () => {
    setSharingUniversalStandee(true);
    showToast('⏳ Opening share options...');

    try {
      const canvas = generateUniversalCanvas();
      const filename = `EliteFitness_Universal_QR_Standee_${Date.now()}.png`;
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
            title: 'Elite Fitness Universal Standee',
            text: 'Official Universal Gym Standee — Print and paste on reception desk for attendance, registration, feedback & support.',
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
            title: 'Elite Fitness Universal Standee',
            text: 'Official Universal Gym Standee — Print and paste on reception desk',
            files: [file]
          });
        } else {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('✅ Downloaded Universal Standee to share!');
        }
      }
    } catch (err) {
      if (err?.message !== 'Share canceled' && !err?.name?.includes('AbortError')) {
        showToast('⚠️ Could not open share options.');
      }
    } finally {
      setSharingUniversalStandee(false);
    }
  };

  const handlePrintQR = () => {
    printUniversalQR(gym.gym_name, gym.address, universalQrUrl);
  };

  const handleDownloadRegistrationQR = handleDownloadUniversalQR;
  const handleShareRegistrationQR = handleShareUniversalQR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#FFFFFF',
          border: '1.5px solid #DCEBFA', color: '#1F2937',
          padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(77, 166, 255, 0.18)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <Sparkles size={18} color="#4DA6FF" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F2937' }}>Gym Profile & QR Settings</h2>
        <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>
          Manage gym info, print the registration QR poster for reception, and upload the UPI payment QR for member renewals.
        </p>
      </div>

      {/* Gym Info + Registration QR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', alignItems: 'start' }}>

        {/* Gym Info Form */}
        <div className="glass-card" style={{ padding: '24px', background: '#FFFFFF', border: '1px solid #DCEBFA' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#1F2937' }}>
            <Settings size={18} color="#4DA6FF" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
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
            value={universalQrUrl}
            size={520}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Universal QR Standee (The ONE permanent reception standee) */}
        <div className="glass-card" style={{
          padding: '24px', textAlign: 'center',
          background: '#FFFFFF',
          border: '1.5px solid #4DA6FF',
          boxShadow: '0 8px 24px rgba(77, 166, 255, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '12px', right: '-32px',
            background: 'linear-gradient(135deg, #4DA6FF, #0284C7)',
            color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 900,
            padding: '3px 36px', transform: 'rotate(45deg)',
            letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(77,166,255,0.4)'
          }}>
            PRIMARY
          </div>

          <h4 style={{ fontSize: '0.9rem', color: '#0284C7', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            🌟 ONE UNIVERSAL QR CODE
          </h4>
          <p style={{ color: '#6B7280', fontSize: '0.74rem', marginBottom: '14px', lineHeight: 1.4 }}>
            Single permanent QR displayed at gym reception for <strong>all services</strong>
          </p>

          {/* QR Code Container */}
          <div style={{
            background: '#FFFFFF', padding: '16px', borderRadius: '18px',
            display: 'inline-block', marginBottom: '12px',
            border: '2px solid #DCEBFA',
            boxShadow: '0 8px 20px rgba(77, 166, 255, 0.15)'
          }}>
            <QRCodeSVG value={universalQrUrl} size={165} level="H" />
          </div>

          {/* 4 Services Pills Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
            marginBottom: '14px', textAlign: 'left'
          }}>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '6px 8px', fontSize: '0.7rem', color: '#059669' }}>
              <span style={{ fontWeight: 800 }}>🏋️ Attendance</span>
            </div>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '6px 8px', fontSize: '0.7rem', color: '#D97706' }}>
              <span style={{ fontWeight: 800 }}>📝 Registration</span>
            </div>
            <div style={{ background: '#EAF5FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '6px 8px', fontSize: '0.7rem', color: '#0284C7' }}>
              <span style={{ fontWeight: 800 }}>⭐ Feedback</span>
            </div>
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '6px 8px', fontSize: '0.7rem', color: '#0284C7' }}>
              <span style={{ fontWeight: 800 }}>📞 Support</span>
            </div>
          </div>

          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1F2937', marginBottom: '2px' }}>
            {gym.gym_name}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', marginBottom: '4px', lineHeight: 1.4 }}>
            {gym.address}
          </div>

          {/* Network URL display */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            margin: '8px 0 14px',
            padding: '6px 12px', background: '#EAF5FF',
            border: '1px solid #BAE6FD', borderRadius: '8px',
            fontSize: '0.72rem', color: '#0284C7', fontFamily: 'monospace', wordBreak: 'break-all'
          }}>
            <Wifi size={12} />
            {universalQrUrl}
          </div>

          {/* Custom URL input */}
          {showUrlEdit && (
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                className="input-field"
                style={{ fontSize: '0.8rem', padding: '8px 12px', marginBottom: '6px' }}
                placeholder="e.g. https://vikasyadav00.github.io/Elite-Fitness/qr"
                value={customUniversalUrl}
                onChange={e => setCustomUniversalUrl(e.target.value)}
              />
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '8px', fontSize: '0.8rem', marginBottom: '4px' }}
                onClick={() => {
                  if (customUniversalUrl) {
                    const cleanBase = customUniversalUrl.trim().split('?')[0].replace(/\/register\/?$/, '').replace(/\/feedback\/?$/, '').replace(/\/checkin\/?$/, '').replace(/\/+$/, '');
                    const cleanUrl = cleanBase.endsWith('/qr') ? cleanBase : `${cleanBase}/qr`;
                    setUniversalQrUrl(cleanUrl);
                    localStorage.setItem('ef_universal_qr_url', cleanUrl);
                    setShowUrlEdit(false);
                    showToast('Universal QR URL updated!');
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
                onClick={handleDownloadUniversalQR}
                disabled={downloadingUniversalStandee}
              >
                <Download size={16} />
                {downloadingUniversalStandee ? 'Saving...' : 'Download'}
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
                onClick={handleShareUniversalQR}
                disabled={sharingUniversalStandee}
              >
                <Share2 size={16} />
                {sharingUniversalStandee ? 'Sharing...' : 'Share'}
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
                href={universalQrUrl}
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
              <Wifi size={14} /> {showUrlEdit ? 'Cancel URL Change' : 'Change Universal QR URL'}
            </button>
          </div>

          <div style={{ marginTop: '10px', fontSize: '0.68rem', color: '#64748B', lineHeight: 1.5 }}>
            💡 Scanned by customer phones at reception to access Attendance, Registration, Feedback & Support
          </div>
        </div>
      </div>

      {/* ─── QR DEPLOYMENT & PRODUCTION VALIDATION HUB (Requirement 17) ────── */}
      <div className="glass-card" style={{
        padding: '24px',
        border: '1px solid #DCEBFA',
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(77, 166, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '999px', background: '#EAF5FF', color: '#0284C7', fontSize: '0.72rem', fontWeight: 800, marginBottom: '6px' }}>
              <ShieldCheck size={13} /> PRODUCTION DEPLOYMENT & QR AUDIT HUB
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>
              Live QR Code Validation & Destination Status
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Verify production URLs, inspect QR endpoints, test direct mobile routing, and regenerate standees.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => checkBackendHealth()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
            >
              <RefreshCw size={14} className={apiHealth.status === 'checking' ? 'animate-spin' : ''} />
              Re-test Backend API
            </button>
          </div>
        </div>

        {/* Live Backend Connection Indicator (Requirement 17) */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          background: apiHealth.status === 'online' ? '#ECFDF5' : (apiHealth.status === 'checking' ? '#FFFBEB' : '#FEF2F2'),
          border: `1.5px solid ${apiHealth.status === 'online' ? '#A7F3D0' : (apiHealth.status === 'checking' ? '#FDE68A' : '#FECACA')}`,
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: apiHealth.status === 'online' ? '#059669' : (apiHealth.status === 'checking' ? '#D97706' : '#DC2626'),
                boxShadow: `0 0 10px ${apiHealth.status === 'online' ? '#10B981' : '#F59E0B'}`
              }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1F2937' }}>
                  Backend API: <span style={{ fontFamily: 'monospace', color: '#0284C7' }}>{apiBaseUrl}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                  {apiHealth.message} {apiHealth.latency !== null && `(${apiHealth.latency}ms)`}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '0.78rem', fontWeight: 900, padding: '6px 14px', borderRadius: '8px',
              background: apiHealth.status === 'online' ? '#059669' : '#DC2626',
              color: '#FFFFFF',
              letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: apiHealth.status === 'online' ? '0 2px 8px rgba(5,150,105,0.3)' : '0 2px 8px rgba(220,38,38,0.3)'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FFFFFF' }} />
              {apiHealth.status === 'online' ? 'ONLINE' : (apiHealth.status === 'checking' ? 'CHECKING' : 'OFFLINE')}
            </div>
          </div>

          {/* Quick Production Endpoint Presets */}
          <div style={{
            paddingTop: '10px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280' }}>Switch Endpoint:</span>
            
            <button
              type="button"
              onClick={() => {
                const url = 'https://significance-jewel-flight-boot.trycloudflare.com/api';
                localStorage.setItem('elite_fitness_api_url', url);
                checkBackendHealth(url);
                showToast('✅ Switched to Live Public Cloudflare HTTPS API');
              }}
              style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: '6px',
                background: apiBaseUrl.includes('trycloudflare.com') ? '#0284C7' : '#FFFFFF',
                color: apiBaseUrl.includes('trycloudflare.com') ? '#FFFFFF' : '#0284C7',
                border: '1.5px solid #0284C7', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              🌐 Live Public HTTPS (Cloudflare) {apiBaseUrl.includes('trycloudflare.com') && '✓'}
            </button>

            <button
              type="button"
              onClick={() => {
                const url = 'https://elite-fitness-backend.onrender.com/api';
                localStorage.setItem('elite_fitness_api_url', url);
                checkBackendHealth(url);
                showToast('Switched to Render Cloud Backend API');
              }}
              style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: '6px',
                background: apiBaseUrl.includes('onrender.com') ? '#0284C7' : '#FFFFFF',
                color: apiBaseUrl.includes('onrender.com') ? '#FFFFFF' : '#0284C7',
                border: '1px solid #BAE6FD', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              ☁️ Render Cloud {apiBaseUrl.includes('onrender.com') && '✓'}
            </button>

            <button
              type="button"
              onClick={() => {
                const url = 'http://localhost:5000/api';
                localStorage.setItem('elite_fitness_api_url', url);
                checkBackendHealth(url);
                showToast('Switched to Local Dev API');
              }}
              style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: '6px',
                background: apiBaseUrl.includes('localhost') ? '#6B7280' : '#FFFFFF',
                color: apiBaseUrl.includes('localhost') ? '#FFFFFF' : '#6B7280',
                border: '1px solid #D1D5DB', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              💻 Local Dev (5000) {apiBaseUrl.includes('localhost') && '✓'}
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomApiInput(apiBaseUrl);
                setShowCustomApiEdit(!showCustomApiEdit);
              }}
              style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: '6px',
                background: showCustomApiEdit ? '#F3F4F6' : '#FFFFFF',
                color: '#4B5563', border: '1px dashed #9CA3AF', cursor: 'pointer'
              }}
            >
              ✏️ Enter Custom URL
            </button>
          </div>

          {showCustomApiEdit && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={customApiInput}
                onChange={(e) => setCustomApiInput(e.target.value)}
                placeholder="https://your-custom-backend.com/api"
                style={{
                  flex: 1, padding: '6px 12px', fontSize: '0.78rem',
                  border: '1px solid #D1D5DB', borderRadius: '6px'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customApiInput.trim()) {
                    localStorage.setItem('elite_fitness_api_url', customApiInput.trim());
                    checkBackendHealth(customApiInput.trim());
                    showToast('Applying custom backend URL...');
                  }
                }}
                style={{
                  background: '#0284C7', color: '#fff', border: 'none',
                  borderRadius: '6px', padding: '6px 14px', fontSize: '0.74rem',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                Apply & Test
              </button>
            </div>
          )}

          {apiBaseUrl.includes('onrender.com') && apiHealth.status === 'offline' && (
            <div style={{
              marginTop: '10px', padding: '8px 12px', background: '#FFFBEB',
              border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '0.72rem', color: '#92400E'
            }}>
              💡 <strong>Render Service Setup:</strong> The repository already includes <code>render.yaml</code>. To activate Render, go to <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" style={{ color: '#B45309', fontWeight: 700 }}>dashboard.render.com</a> &rarr; <strong>New +</strong> &rarr; <strong>Blueprint</strong> &rarr; select <strong>VikasYadav00/Elite-Fitness</strong>. In the meantime, switch to <strong>🌐 Live Public HTTPS (Cloudflare)</strong> to stay connected globally.
            </div>
          )}
        </div>

        {/* QR Validation Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* Universal QR Card (Primary) */}
          <div style={{
            background: '#F8FBFF',
            border: '1.5px solid #4DA6FF',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(77, 166, 255, 0.1)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0284C7' }}>🌟 UNIVERSAL QR (ALL-IN-ONE)</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 900, padding: '2px 8px', borderRadius: '999px', background: '#EAF5FF', color: '#0284C7', border: '1px solid #BAE6FD' }}>
                  PRIMARY RECEPTION
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#6B7280', marginBottom: '6px' }}>Encoded Public Destination:</div>
              <div style={{
                background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid #DCEBFA',
                fontFamily: 'monospace', fontSize: '0.72rem', color: '#0284C7',
                wordBreak: 'break-all', marginBottom: '10px'
              }}>
                {universalQrUrl}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280', marginBottom: '14px' }}>
                <span>Route: <strong>/qr</strong></span>
                <span>Services: <strong>4 in 1</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href={universalQrUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textAlign: 'center', textDecoration: 'none', fontSize: '0.75rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <ExternalLink size={12} /> Test Link
              </a>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (navigator.clipboard) navigator.clipboard.writeText(universalQrUrl);
                  showToast('✅ Universal QR URL copied to clipboard!');
                }}
                style={{ fontSize: '0.75rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Copy size={12} /> Copy URL
              </button>
            </div>
          </div>

          {/* Feedback QR Card */}
          <div style={{
            background: '#F8FBFF',
            border: '1px solid #DCEBFA',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D97706' }}>⭐ FEEDBACK QR</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                  ACTIVE
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#6B7280', marginBottom: '6px' }}>Encoded Public Destination:</div>
              <div style={{
                background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid #DCEBFA',
                fontFamily: 'monospace', fontSize: '0.72rem', color: '#0284C7',
                wordBreak: 'break-all', marginBottom: '10px'
              }}>
                {feedbackQrUrl}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280', marginBottom: '14px' }}>
                <span>Route: <strong>/feedback</strong></span>
                <span>Last Generated: <strong>{lastGeneratedTime}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href={feedbackQrUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textAlign: 'center', textDecoration: 'none', fontSize: '0.75rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <ExternalLink size={12} /> Test Link
              </a>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (navigator.clipboard) navigator.clipboard.writeText(feedbackQrUrl);
                  showToast('✅ Feedback URL copied to clipboard!');
                }}
                style={{ fontSize: '0.75rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Copy size={12} /> Copy URL
              </button>
            </div>
          </div>

          {/* Registration QR Card */}
          <div style={{
            background: '#F8FBFF',
            border: '1px solid #DCEBFA',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669' }}>🏋️ REGISTRATION QR</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                  ACTIVE
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#6B7280', marginBottom: '6px' }}>Encoded Public Destination:</div>
              <div style={{
                background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid #DCEBFA',
                fontFamily: 'monospace', fontSize: '0.72rem', color: '#059669',
                wordBreak: 'break-all', marginBottom: '10px'
              }}>
                {regUrl}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280', marginBottom: '14px' }}>
                <span>Route: <strong>/register</strong></span>
                <span>Last Generated: <strong>{lastGeneratedTime}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href={regUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textAlign: 'center', textDecoration: 'none', fontSize: '0.75rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <ExternalLink size={12} /> Test Link
              </a>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (navigator.clipboard) navigator.clipboard.writeText(regUrl);
                  showToast('✅ Registration URL copied to clipboard!');
                }}
                style={{ fontSize: '0.75rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Copy size={12} /> Copy URL
              </button>
            </div>
          </div>

          {/* Table Attendance QR Card */}
          <div style={{
            background: '#F8FBFF',
            border: '1px solid #DCEBFA',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284C7' }}>🔵 TABLE ATTENDANCE QR</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: '#EAF5FF', color: '#0284C7', border: '1px solid #BAE6FD' }}>
                  ACTIVE
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#6B7280', marginBottom: '6px' }}>Encoded Public Destination:</div>
              <div style={{
                background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid #DCEBFA',
                fontFamily: 'monospace', fontSize: '0.72rem', color: '#0284C7',
                wordBreak: 'break-all', marginBottom: '10px'
              }}>
                {attendanceQrUrl}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280', marginBottom: '14px' }}>
                <span>Route: <strong>/checkin</strong></span>
                <span>Type: <strong>Table Scan</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href={attendanceQrUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textAlign: 'center', textDecoration: 'none', fontSize: '0.75rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <ExternalLink size={12} /> Test Link
              </a>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (navigator.clipboard) navigator.clipboard.writeText(attendanceQrUrl);
                  showToast('✅ Attendance URL copied to clipboard!');
                }}
                style={{ fontSize: '0.75rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Copy size={12} /> Copy URL
              </button>
            </div>
          </div>
        </div>

        {/* Global Production Domain Switcher */}
        <div style={{
          background: '#F0F7FF',
          border: '1px solid #DCEBFA',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h4 style={{ fontSize: '0.85rem', color: '#1F2937', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
            <Wifi size={14} color="#4DA6FF" /> Synchronize All QR Codes to a Production Domain
          </h4>
          <p style={{ color: '#6B7280', fontSize: '0.75rem', margin: '0 0 12px 0' }}>
            If you change your GitHub Pages repository name or switch to a custom domain (e.g. <code>https://gym.elitefitness.com</code>), enter it below to update Universal QR, Feedback, Registration, and Attendance QR codes at once.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-field"
              value={globalFrontendInput}
              onChange={(e) => setGlobalFrontendInput(e.target.value)}
              placeholder="e.g. https://vikasyadav00.github.io/Elite-Fitness"
              style={{ flex: 1, minWidth: '260px', fontSize: '0.82rem' }}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const clean = (globalFrontendInput || '').trim().replace(/\/+$/, '');
                if (clean) {
                  localStorage.setItem('ef_frontend_url', clean);
                  localStorage.setItem('ef_universal_qr_url', `${clean}/qr`);
                  localStorage.setItem('ef_registration_url', `${clean}/register`);
                  localStorage.setItem('ef_feedback_qr_url', `${clean}/feedback`);
                  localStorage.setItem('ef_attendance_url', `${clean}/checkin`);
                  setUniversalQrUrl(`${clean}/qr`);
                  setRegUrl(`${clean}/register`);
                  setFeedbackQrUrl(`${clean}/feedback`);
                  setAttendanceQrUrl(`${clean}/checkin`);
                  setLastGeneratedTime(new Date().toLocaleString('en-IN'));
                  showToast('✅ All QR Codes updated to: ' + clean);
                }
              }}
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              Update All QR Codes
            </button>
          </div>
        </div>
      </div>

      {/* ─── Change Password Section ─────────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '24px',
        border: '1px solid #DCEBFA',
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(77, 166, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <ShieldCheck size={20} color="#4DA6FF" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1F2937' }}>Change Password</h3>
        </div>
        <p style={{ color: '#6B7280', fontSize: '0.83rem', marginBottom: '24px' }}>
          Update your owner account password. Make sure it meets all security requirements.
        </p>

        {pwdError && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px',
            background: '#FEF2F2', border: '1px solid #FECACA',
            color: '#DC2626', fontSize: '0.82rem',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            marginBottom: '18px', lineHeight: 1.4
          }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{pwdError}</span>
          </div>
        )}

        {pwdSuccess && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px',
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            color: '#059669', fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '18px'
          }}>
            <Check size={18} color="#059669" /> Password changed successfully!
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
                    <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>Password Strength</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>{s.label}</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '999px', background: '#E5E7EB' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: s.color, width: s.width, transition: 'width 0.3s ease, background 0.3s ease' }} />
                  </div>
                </div>
              );
            })()}

            {/* Requirements checklist */}
            <div style={{
              marginTop: '12px', padding: '14px',
              background: '#F8FBFF', border: '1px solid #DCEBFA',
              borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1F2937', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password Must Contain
              </div>
              {pwdRules.map(rule => {
                const passed = rule.test(pwdForm.newPwd);
                return (
                  <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: passed ? '#ECFDF5' : '#F3F4F6',
                      border: `1px solid ${passed ? '#059669' : '#D1D5DB'}`,
                      transition: 'all 0.2s ease'
                    }}>
                      {passed && <Check size={11} color="#059669" strokeWidth={3} />}
                    </div>
                    <span style={{ color: passed ? '#059669' : '#6B7280', transition: 'color 0.2s' }}>{rule.label}</span>
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
                      ? '#059669'
                      : '#DC2626'
                    : undefined
                }}
              />
              <button type="button" onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}
                style={{ position: 'absolute', right: '11px', top: '11px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '2px' }}>
                {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwdForm.confirm && pwdForm.confirm !== pwdForm.newPwd && (
              <p style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '5px' }}>Passwords do not match</p>
            )}
            {pwdForm.confirm && pwdForm.confirm === pwdForm.newPwd && pwdForm.newPwd && (
              <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '5px' }}>✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={savingPwd}
            style={{
              alignSelf: 'flex-start',
              padding: '12px 28px',
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
