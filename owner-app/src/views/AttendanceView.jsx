import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, QrCode, CheckCircle, UserCheck, Plus, X,
  Shield, Smartphone, RefreshCw, Copy, Check, AlertCircle, Sparkles,
  Download, Printer, Wifi, ExternalLink, Share2
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import api from '../api';

const MOCK_ATTENDANCE = [
  { id: '1', reg_id: 'EF26091001', name: 'Rahul Sharma', time: '06:15 AM', method: 'QR (Table Scan)', device_id: 'DEV-98a7**4b', status: 'PRESENT' },
  { id: '2', reg_id: 'EF26091002', name: 'Priya Verma', time: '07:30 AM', method: 'QR (Table Scan)', device_id: 'DEV-12c4**9e', status: 'PRESENT' },
  { id: '3', reg_id: 'EF26091005', name: 'Vikram Singh', time: '08:10 AM', method: 'MANUAL', device_id: 'OWNER-OVERRIDE', status: 'PRESENT' },
  { id: '4', reg_id: 'EF26091006', name: 'Ananya Deshmukh', time: '09:05 AM', method: 'QR (Table Scan)', device_id: 'DEV-77f2**1a', status: 'PRESENT' }
];

const generateLocalQR = () => {
  const token = `EF-ATT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const today = new Date().toISOString().split('T')[0];
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return {
    session_token: token,
    valid_for_date: today,
    expires_at: expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};

export default function AttendanceView() {
  const [attendance, setAttendance] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ef_attendance_logs') || '[]');
      if (stored.length > 0) return stored;
    } catch (e) {}
    return MOCK_ATTENDANCE;
  });

  const [showManualModal, setShowManualModal] = useState(false);
  const [showQRPanel, setShowQRPanel] = useState(true);
  const [manualRegId, setManualRegId] = useState('');
  const [qrSession, setQrSession] = useState(generateLocalQR);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [sharingQR, setSharingQR] = useState(false);

  // Network Checkin URL (accessible by phones scanning at reception table)
  const [attendanceUrl, setAttendanceUrl] = useState(() => {
    const saved = localStorage.getItem('ef_attendance_url');
    if (saved && !saved.includes('localhost') && !saved.includes('127.0.0.1')) return saved;
    const hostname = window.location.hostname;
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://192.168.1.49:3000/checkin';
    }
    return `http://${hostname}:3000/checkin`;
  });
  const [customUrlInput, setCustomUrlInput] = useState(attendanceUrl);
  const [showUrlEdit, setShowUrlEdit] = useState(false);

  const qrCanvasRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // The actual clickable URL encoded into the table QR
  const qrValue = `${attendanceUrl}?token=${qrSession?.session_token || 'EF-ATT-TABLE'}`;

  // Handle Automatic Scan checkin
  const handleAutoScanMark = (name, regId) => {
    const candidateMembers = [
      { name: 'Karthik Iyer', reg: 'EF26091007' },
      { name: 'Meena Joshi', reg: 'EF26091008' },
      { name: 'Deepa Reddy', reg: 'EF26091010' },
      { name: 'Sneha Gupta', reg: 'EF26091004' },
      { name: 'Rajesh Kumar', reg: 'EF26091011' }
    ];
    const picked = name && regId ? { name, reg: regId } : candidateMembers[Math.floor(Math.random() * candidateMembers.length)];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry = {
      id: String(Date.now()),
      reg_id: picked.reg,
      name: picked.name,
      time: timeStr,
      method: 'QR (Table Scan)',
      device_id: `DEV-${Math.random().toString(36).substring(2, 6).toUpperCase()}**${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
      status: 'PRESENT'
    };
    setAttendance(prev => {
      const updated = [newEntry, ...prev.filter(p => p.reg_id !== picked.reg)];
      try { localStorage.setItem('ef_attendance_logs', JSON.stringify(updated)); } catch(e){}
      return updated;
    });
    showToast(`⚡ ${picked.name} scanned Table QR — Checked in automatically!`);
  };

  // Listen for storage events (e.g. member app or checkin web page marking attendance)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'ef_member_checkin' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          handleAutoScanMark(data.name, data.reg_id);
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Poll backend for today's attendance if backend reachable
  useEffect(() => {
    async function fetchToday() {
      try {
        const res = await api.get('/attendance/today');
        if (res.data?.success && res.data.data?.records && res.data.data.records.length > 0) {
          const formatted = res.data.data.records.map(r => ({
            id: String(r.id),
            reg_id: r.registration_id || 'EF26091001',
            name: r.full_name || 'Member',
            time: new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            method: r.method || 'QR',
            device_id: r.device_fingerprint || 'DEV-PHONE',
            status: r.status || 'PRESENT'
          }));
          setAttendance(prev => {
            const map = new Map();
            [...formatted, ...prev].forEach(item => map.set(item.reg_id || item.id, item));
            return Array.from(map.values());
          });
        }
      } catch (_) {}
    }
    fetchToday();
  }, []);

  const handleGenerateQR = async () => {
    const localSession = generateLocalQR();
    setQrSession(localSession);
    setGeneratingQR(false);
    showToast('Attendance QR refreshed & ready for scanning!');

    try {
      const res = await api.post('/attendance/generate-qr');
      if (res.data?.success && res.data?.data) {
        setQrSession(res.data.data);
      }
    } catch (_) {}
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Check-in URL copied!');
  };

  const handleManualCheckin = (e) => {
    e.preventDefault();
    const newEntry = {
      id: String(Date.now()),
      reg_id: manualRegId || 'EF26091099',
      name: 'Walk-in Member Check-in',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: 'MANUAL',
      device_id: 'OWNER-OVERRIDE',
      status: 'PRESENT'
    };
    setAttendance([newEntry, ...attendance]);
    setShowManualModal(false);
    setManualRegId('');
    showToast(`Attendance marked for ${newEntry.reg_id}`);
  };

  // ─── GENERATE HIGH-RES TABLE STANDEE CANVAS ──────────────────────────────
  const generateStandeeCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1450;
    const ctx = canvas.getContext('2d');

    // 1. Dark Slate Gradient Background
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
    ctx.fillText('DAILY ATTENDANCE', canvas.width / 2, 210);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('SCAN HERE TO MARK YOUR ATTENDANCE', canvas.width / 2, 260);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px sans-serif';
    ctx.fillText('Point your phone camera or member app at the QR code below', canvas.width / 2, 305);

    // 4. Draw Crisp QR Code on White Box
    const qrBoxSize = 620;
    const qrBoxX = (canvas.width - qrBoxSize) / 2;
    const qrBoxY = 350;

    // White rounded card for QR
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();

    // Copy rendered QR canvas into the poster
    if (qrCanvasRef.current) {
      const qrInnerSize = 520;
      const innerX = (canvas.width - qrInnerSize) / 2;
      const innerY = qrBoxY + (qrBoxSize - qrInnerSize) / 2;
      ctx.drawImage(qrCanvasRef.current, innerX, innerY, qrInnerSize, qrInnerSize);
    }

    // 5. Standee Instructions below QR
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('⚡ 1-TAP INSTANT CHECK-IN', canvas.width / 2, 1040);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Enter Registration ID or Mobile Number to Check In', canvas.width / 2, 1090);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px sans-serif';
    ctx.fillText('Contactless • Device-Locked • Live Attendance Sync', canvas.width / 2, 1135);

    // 6. Footer Divider & Gym Contact
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 1185);
    ctx.lineTo(canvas.width - 100, 1185);
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Reception Desk • Help: 8953933110 • Sector 14, Lucknow', canvas.width / 2, 1235);

    // Clean footer branding — no raw URL text
    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText('Powered by Elite Fitness Management System', canvas.width / 2, 1295);

    return canvas;
  };

  // ─── DOWNLOAD TABLE QR STANDEE (SAVES DIRECTLY TO PHONE STORAGE) ─────────
  const handleDownloadTableQR = async () => {
    setDownloadingQR(true);
    showToast('⏳ Downloading Table QR Standee...');

    try {
      const canvas = generateStandeeCanvas();
      const filename = `EliteFitness_Table_Attendance_QR_${Date.now()}.png`;
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
        // Web Browser: standard PNG download
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('✅ Downloaded Table QR Standee image!');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Could not complete download. Try print button.');
    } finally {
      setDownloadingQR(false);
    }
  };

  // ─── SHARE TABLE QR STANDEE (OPENS NATIVE SHARE / WHATSAPP / DRIVE) ───────
  const handleShareTableQR = async () => {
    setSharingQR(true);
    showToast('⏳ Opening share options...');

    try {
      const canvas = generateStandeeCanvas();
      const filename = `EliteFitness_Table_Attendance_QR_${Date.now()}.png`;
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
            title: 'Elite Fitness Table Attendance QR',
            text: 'Official Table Attendance QR Standee — Print and paste on gym table/counter.',
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
            title: 'Elite Fitness Table Attendance QR',
            text: 'Official Table Attendance QR Standee',
            files: [file]
          });
        } else {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('✅ Downloaded image to share!');
        }
      }
    } catch (err) {
      if (err?.message !== 'Share canceled' && !err?.name?.includes('AbortError')) {
        showToast('⚠️ Could not open share options.');
      }
    } finally {
      setSharingQR(false);
    }
  };

  // ─── PRINT TABLE STANDEE (CLEAN STAND-ALONE POPUP) ───────────────────────
  const handlePrintTableStandee = () => {
    const printWin = window.open('', '_blank', 'width=600,height=800');
    if (!printWin) {
      alert('Pop-up blocked! Please allow pop-ups to print table standee.');
      return;
    }

    const canvas = generateStandeeCanvas();
    const dataUrl = canvas.toDataURL('image/png');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Elite Fitness — Table Attendance Standee</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#FFF; padding:20px; }
          img { max-width:100%; height:auto; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.2); }
          @media print { body { padding:0; } img { box-shadow:none; max-width:100%; width:100%; } }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="Elite Fitness Attendance Standee" />
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

  const qrCheckinsCount = attendance.filter(a => a.method.includes('QR')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Hidden QRCodeCanvas used to extract raw sharp QR into Standee */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <QRCodeCanvas
          ref={qrCanvasRef}
          value={qrValue}
          size={520}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          border: '1px solid #10B981',
          color: '#F9FAFB',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          backdropFilter: 'blur(8px)'
        }}>
          <Sparkles size={18} color="#10B981" />
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
            Attendance & Desk Check-In
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.82rem', margin: '4px 0 0' }}>
            Table Standee QR code for members to mark attendance • Live check-in feed
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            style={{ padding: '9px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setShowManualModal(true)}
          >
            <Plus size={16} /> Manual Check-in
          </button>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Total Present Today</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F9FAFB' }}>{attendance.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Table QR Scans</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38BDF8' }}>{qrCheckinsCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Table Standee Status</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>Ready for Desk</div>
          </div>
        </div>
      </div>

      {/* QR Code Attendance Display Panel */}
      {showQRPanel && (
        <div className="glass-card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Left: QR Code in Gold Stand Frame */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: '#FFFFFF',
              padding: '16px',
              borderRadius: '20px',
              boxShadow: '0 12px 36px rgba(245, 158, 11, 0.25), 0 0 0 3px rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QRCodeSVG
                value={qrValue}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Main Action Buttons: Download, Share, Print, Copy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '320px' }}>
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
                  onClick={handleDownloadTableQR}
                  disabled={downloadingQR}
                >
                  <Download size={16} />
                  {downloadingQR ? 'Saving...' : 'Download'}
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
                  onClick={handleShareTableQR}
                  disabled={sharingQR}
                >
                  <Share2 size={16} />
                  {sharingQR ? 'Sharing...' : 'Share'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handlePrintTableStandee}
                >
                  <Printer size={14} /> Print Standee
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handleCopyPayload}
                >
                  {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy URL'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAutoScanMark()}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.25))',
                  border: '1px solid rgba(16,185,129,0.4)',
                  color: '#10B981',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} /> Simulate Member Scan Demo
              </button>
            </div>
          </div>

          {/* Right: Security & Table Standee Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', width: 'fit-content', fontSize: '0.75rem', fontWeight: 800 }}>
                <Shield size={14} /> TABLE STANDEE FOR RECEPTION DESK
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: '#10B981', width: 'fit-content', fontSize: '0.75rem', fontWeight: 800 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                Auto-Saves to Backend
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
              Table Attendance Standee
            </h3>

            <p style={{ color: '#D1D5DB', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              Download and print this QR standee to paste on your front desk or reception table. Members point their phone camera at the QR to clock in automatically!
            </p>

            {/* Checkin URL Info Box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9CA3AF' }}>Scannable Link:</span>
                <a
                  href={qrValue}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                >
                  Test Link in Browser <ExternalLink size={12} />
                </a>
              </div>

              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                color: '#38BDF8',
                wordBreak: 'break-all'
              }}>
                <Wifi size={12} style={{ display: 'inline', marginRight: '6px' }} />
                {attendanceUrl}
              </div>

              {showUrlEdit ? (
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: '0.78rem', padding: '6px 10px', flex: 1 }}
                    value={customUrlInput}
                    onChange={e => setCustomUrlInput(e.target.value)}
                    placeholder="http://192.168.1.49:3000/checkin"
                  />
                  <button
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        setAttendanceUrl(customUrlInput.trim());
                        localStorage.setItem('ef_attendance_url', customUrlInput.trim());
                        setShowUrlEdit(false);
                        showToast('Attendance link updated!');
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                    onClick={() => setShowUrlEdit(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowUrlEdit(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#F59E0B',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Change IP / Custom Domain Link
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '0.75rem' }}>
              <AlertCircle size={14} color="#F59E0B" />
              <span>When members scan this QR on the table, their attendance immediately reflects on your screen feed below!</span>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Today's Check-in Feed</h3>
          <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Showing latest entries</span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>REG ID</th>
              <th>MEMBER NAME</th>
              <th>CHECK-IN TIME</th>
              <th>CHECK-IN METHOD</th>
              <th>DEVICE IDENTIFIER</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#F59E0B' }}>{item.reg_id}</td>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td>{item.time}</td>
                <td>
                  <span className={`status-badge ${item.method.includes('QR') ? 'status-frozen' : 'status-inactive'}`}>
                    {item.method.includes('QR') ? <QrCode size={12} /> : <Clock size={12} />} {item.method}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#9CA3AF' }}>
                  {item.device_id}
                </td>
                <td>
                  <span className="status-badge status-active">
                    <CheckCircle size={12} /> {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Checkin Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#F59E0B', fontWeight: 800, margin: 0 }}>Manual Attendance Check-in</h3>
              <X size={20} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setShowManualModal(false)} />
            </div>

            <form onSubmit={handleManualCheckin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Member Registration ID or Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EF26091001 or 9876543210"
                  className="input-field"
                  value={manualRegId}
                  onChange={(e) => setManualRegId(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowManualModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Mark Present
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
