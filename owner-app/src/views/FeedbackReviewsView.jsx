import React, { useState, useEffect, useRef } from 'react';
import {
  Star, MessageSquare, ThumbsUp, Sparkles, Filter, RefreshCw,
  Download, Share2, Printer, ExternalLink, QrCode, ShieldCheck,
  CheckCircle2, AlertCircle, User, Phone, Calendar, Send, Trash2,
  Check, Wifi, MapPin
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import api from '../api';
import { fetchCloudEvents, subscribeCloudStream } from '../utils/cloudSync';

const SEED_FEEDBACKS = [
  {
    id: 'fb-101',
    name: 'Rohit Malhotra',
    phone: '9876543210',
    member_status: 'ACTIVE_MEMBER',
    rating: 5,
    cleanliness_rating: 5,
    equipment_rating: 5,
    trainer_rating: 5,
    category: 'TRAINER',
    comments: 'Superb guidance by trainer Amit Sir! Helped me correct my squat and deadlift posture within a week. Highly recommended gym in Sector 14.',
    source: 'GOOGLE_LENS_QR',
    status: 'ACKNOWLEDGED',
    owner_notes: 'Thank you Rohit! Keep pushing hard.',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'fb-102',
    name: 'Ananya Sharma',
    phone: '9812345678',
    member_status: 'ACTIVE_MEMBER',
    rating: 5,
    cleanliness_rating: 5,
    equipment_rating: 5,
    trainer_rating: 5,
    category: 'CLEANLINESS',
    comments: 'Very clean workout floor, air conditioning is always optimal, and changing rooms are sanitized regularly. 5 stars for hygiene!',
    source: 'GOOGLE_LENS_QR',
    status: 'ACKNOWLEDGED',
    owner_notes: '',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'fb-103',
    name: 'Vikas Kushwaha',
    phone: '8953933110',
    member_status: 'ACTIVE_MEMBER',
    rating: 4,
    cleanliness_rating: 5,
    equipment_rating: 4,
    trainer_rating: 5,
    category: 'EQUIPMENT',
    comments: 'Great machines. Could you please add one more cable crossover machine? It gets a little crowded during 7 PM evening peak hours.',
    source: 'GOOGLE_LENS_QR',
    status: 'NEW',
    owner_notes: '',
    created_at: new Date(Date.now() - 3600000 * 32).toISOString()
  },
  {
    id: 'fb-104',
    name: 'Pooja Tiwari',
    phone: '9765432198',
    member_status: 'TRIAL_GUEST',
    rating: 5,
    cleanliness_rating: 5,
    equipment_rating: 5,
    trainer_rating: 5,
    category: 'GENERAL',
    comments: 'Took a trial session today. The reception staff was very welcoming and explained all membership packages clearly. Taking the 6-month pass tomorrow!',
    source: 'GOOGLE_LENS_QR',
    status: 'NEW',
    owner_notes: '',
    created_at: new Date(Date.now() - 3600000 * 50).toISOString()
  }
];

export default function FeedbackReviewsView() {
  const [feedbacks, setFeedbacks] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ef_feedbacks_data') || '[]');
      if (stored && stored.length > 0) return stored;
    } catch (_) {}
    return SEED_FEEDBACKS;
  });

  const [loading, setLoading] = useState(false);
  const [starFilter, setStarFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  const [downloadingStandee, setDownloadingStandee] = useState(false);
  const [sharingStandee, setSharingStandee] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const PUBLIC_FEEDBACK_URL = 'https://vikasyadav00.github.io/Elite-Fitness/?feedback=1';

  // Standee QR URL detection (accessible by phone cameras & Google Lens worldwide)
  const [feedbackUrl, setFeedbackUrl] = useState(() => {
    const saved = localStorage.getItem('ef_feedback_qr_url');
    // Auto-upgrade from old LAN/localhost IP to the global GitHub Pages web server URL
    if (saved && !saved.includes('localhost') && !saved.includes('127.0.0.1') && !saved.includes('192.168.')) {
      return saved;
    }
    return PUBLIC_FEEDBACK_URL;
  });
  const [customFeedbackUrl, setCustomFeedbackUrl] = useState(feedbackUrl);
  const [showUrlEdit, setShowUrlEdit] = useState(false);

  const qrCanvasRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch from cloud sync (ntfy.sh) AND local backend - polls every 10 seconds for real-time live updates
  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      // 1. Fetch from cloud sync topic (instant worldwide reviews from GitHub Pages)
      const cloudEvents = await fetchCloudEvents('24h');
      const cloudFeedbacks = cloudEvents
        .filter(e => e.event === 'FEEDBACK_SUBMITTED' && e.data)
        .map(e => e.data);

      // 2. Fetch from local backend
      let backendFeedbacks = [];
      try {
        const res = await api.get('/feedback');
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          backendFeedbacks = res.data.data;
        }
      } catch (_) {}

      // 3. Merge: seed + local state + backend + cloud feedbacks (deduplicated by ID)
      setFeedbacks(prev => {
        const map = new Map();
        // Seed first
        SEED_FEEDBACKS.forEach(f => map.set(f.id, f));
        // Then previous state / local storage
        prev.forEach(f => map.set(f.id, f));
        // Then local backend
        backendFeedbacks.forEach(f => map.set(f.id, f));
        // Then cloud feedbacks (highest priority for new QR submissions)
        cloudFeedbacks.forEach(f => {
          const existing = map.get(f.id);
          map.set(f.id, {
            ...f,
            status: existing?.status || f.status || 'NEW',
            owner_notes: existing?.owner_notes || f.owner_notes || ''
          });
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        localStorage.setItem('ef_feedbacks_data', JSON.stringify(merged));
        return merged;
      });
    } catch (_) {
      // Offline fallback: keep existing state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();

    // 1. Real-time SSE stream for instant 0ms notification when a review is submitted
    const unsubscribe = subscribeCloudStream((msg) => {
      if (msg.event === 'FEEDBACK_SUBMITTED' && msg.data) {
        const newFb = msg.data;
        setFeedbacks(prev => {
          if (prev.some(f => f.id === newFb.id)) return prev;
          const updated = [newFb, ...prev];
          localStorage.setItem('ef_feedbacks_data', JSON.stringify(updated));
          return updated;
        });
        showToast(`⭐ New ${newFb.rating}★ Review from ${newFb.name || 'a Member'}!`);
      }
    });

    // 2. Polling every 10 seconds to catch all reviews reliably
    const pollInterval = setInterval(fetchFeedbacks, 10000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Update status / owner reply
  const handleAcknowledge = async (id) => {
    const updated = feedbacks.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: 'ACKNOWLEDGED',
          owner_notes: replyText.trim() || f.owner_notes || 'Reviewed by Gym Owner'
        };
      }
      return f;
    });
    setFeedbacks(updated);
    localStorage.setItem('ef_feedbacks_data', JSON.stringify(updated));

    try {
      await api.patch(`/feedback/${id}/status`, {
        status: 'ACKNOWLEDGED',
        owner_notes: replyText.trim() || 'Reviewed by Gym Owner'
      });
    } catch (_) {}

    setActiveReplyId(null);
    setReplyText('');
    showToast('✅ Review marked as Acknowledged!');
  };

  // Delete feedback
  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback entry?')) return;
    const filtered = feedbacks.filter(f => f.id !== id);
    setFeedbacks(filtered);
    localStorage.setItem('ef_feedbacks_data', JSON.stringify(filtered));

    try {
      await api.delete(`/feedback/${id}`);
    } catch (_) {}
    showToast('Feedback removed.');
  };

  // Metrics
  const totalCount = feedbacks.length;
  const avgRating = totalCount > 0
    ? (feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  const avgCleanliness = totalCount > 0
    ? (feedbacks.reduce((acc, f) => acc + (Number(f.cleanliness_rating) || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  const avgEquipment = totalCount > 0
    ? (feedbacks.reduce((acc, f) => acc + (Number(f.equipment_rating) || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  const avgTrainer = totalCount > 0
    ? (feedbacks.reduce((acc, f) => acc + (Number(f.trainer_rating) || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  // Filtered list
  const filteredFeedbacks = feedbacks.filter(f => {
    if (starFilter !== 'ALL' && String(f.rating) !== String(starFilter)) return false;
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    return true;
  });

  // ─── GENERATE GOOGLE LENS FEEDBACK STANDEE CANVAS ─────────────────────────
  const generateStandeeCanvas = () => {
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
    ctx.font = '900 60px sans-serif';
    ctx.fillText('RATE YOUR EXPERIENCE', canvas.width / 2, 210);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('SCAN WITH GOOGLE LENS OR CAMERA TO REVIEW US', canvas.width / 2, 260);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px sans-serif';
    ctx.fillText('⭐⭐⭐⭐⭐ 1-Minute Member Review & Suggestions', canvas.width / 2, 305);

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
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('⭐ YOUR VOICE SHAPES OUR GYM!', canvas.width / 2, 1040);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Equipment • Cleanliness • Trainer Coaching • Facilities', canvas.width / 2, 1090);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '20px sans-serif';
    ctx.fillText('Point your phone camera or Google Lens at this code to open the feedback form', canvas.width / 2, 1135);

    // 6. Divider & Gym Contact
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 1185);
    ctx.lineTo(canvas.width - 100, 1185);
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Help Desk: 8953933110 • Sector 14, Lucknow', canvas.width / 2, 1235);

    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText('Powered by Elite Fitness Management System', canvas.width / 2, 1295);

    return canvas;
  };

  // ─── DOWNLOAD FEEDBACK STANDEE ────────────────────────────────────────────
  const handleDownloadStandee = async () => {
    setDownloadingStandee(true);
    showToast('⏳ Downloading Feedback Standee...');

    try {
      const canvas = generateStandeeCanvas();
      const filename = `EliteFitness_Feedback_Standee_${Date.now()}.png`;
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
        showToast('✅ Downloaded Feedback Standee image!');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Could not complete download. Try print button.');
    } finally {
      setDownloadingStandee(false);
    }
  };

  // ─── SHARE FEEDBACK STANDEE ──────────────────────────────────────────────
  const handleShareStandee = async () => {
    setSharingStandee(true);
    showToast('⏳ Opening share options...');

    try {
      const canvas = generateStandeeCanvas();
      const filename = `EliteFitness_Feedback_Standee_${Date.now()}.png`;
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
            title: 'Elite Fitness Member Review Standee',
            text: 'Official Google Lens Review Standee for Elite Fitness. Print and paste on gym mirror/counter.',
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
            title: 'Elite Fitness Member Review Standee',
            text: 'Official Google Lens Review Standee',
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

  // ─── PRINT FEEDBACK STANDEE ──────────────────────────────────────────────
  const handlePrintStandee = () => {
    const printWin = window.open('', '_blank', 'width=600,height=800');
    if (!printWin) {
      alert('Pop-up blocked! Please allow pop-ups to print review standee.');
      return;
    }

    const canvas = generateStandeeCanvas();
    const dataUrl = canvas.toDataURL('image/png');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Elite Fitness — Google Lens Review Standee</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#FFF; padding:20px; }
          img { max-width:100%; height:auto; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.2); }
          @media print { body { padding:0; } img { box-shadow:none; max-width:100%; width:100%; } }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="Elite Fitness Feedback Standee" />
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

      {/* Hidden QRCodeCanvas for sharp standee canvas export */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <QRCodeCanvas
          ref={qrCanvasRef}
          value={feedbackUrl}
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
              <Star size={14} fill="#F59E0B" /> CUSTOMER REVIEWS & FEEDBACK
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#F9FAFB', margin: '0 0 4px 0' }}>
              Member Feedback & Google Lens Standee
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>
              Read live feedback submitted by members. Print or share the Google Lens QR standee for gym mirrors & reception desk.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchFeedbacks}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh Reviews'}
          </button>
        </div>
      </div>

      {/* Rating Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
        gap: '14px'
      }}>
        {/* Overall Rating */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={24} fill="#F59E0B" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Average Rating</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#F9FAFB' }}>
              {avgRating} <span style={{ fontSize: '0.9rem', color: '#F59E0B' }}>★</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#10B981' }}>{totalCount} Total Reviews</div>
          </div>
        </div>

        {/* Cleanliness */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Cleanliness</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#10B981' }}>{avgCleanliness} ★</div>
            <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Gym & Lockers</div>
          </div>
        </div>

        {/* Equipment */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ThumbsUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Equipment</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#38BDF8' }}>{avgEquipment} ★</div>
            <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Machines & Weights</div>
          </div>
        </div>

        {/* Trainers */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Trainers</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#EC4899' }}>{avgTrainer} ★</div>
            <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Coaching Quality</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Standee Card on Left, Reviews Feed on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>

        {/* Column 1: Google Lens Feedback QR Standee */}
        <div className="glass-card" style={{
          padding: '24px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          border: '2px solid #F59E0B',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            📱 GOOGLE LENS FEEDBACK STANDEE
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '0.72rem', margin: '0 0 16px 0' }}>
            Members scan with Google Lens or any camera to rate the gym
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
            <QRCodeSVG
              value={feedbackUrl}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#F8FAFC', marginBottom: '2px' }}>
            Elite Fitness Club
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '8px' }}>
            Sector 14, Lucknow • Scan to leave a review & suggestion
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
            {feedbackUrl}
          </div>

          {/* Custom URL Editor */}
          {showUrlEdit && (
            <div style={{ marginBottom: '14px' }}>
              <input
                type="text"
                className="input-field"
                style={{ fontSize: '0.8rem', padding: '8px 12px', marginBottom: '6px' }}
                placeholder="e.g. https://vikasyadav00.github.io/Elite-Fitness/?feedback=1"
                value={customFeedbackUrl}
                onChange={e => setCustomFeedbackUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                onClick={() => {
                  if (customFeedbackUrl) {
                    setFeedbackUrl(customFeedbackUrl.trim());
                    localStorage.setItem('ef_feedback_qr_url', customFeedbackUrl.trim());
                    setShowUrlEdit(false);
                    showToast('Feedback QR URL updated!');
                  }
                }}
              >
                Apply URL
              </button>
            </div>
          )}

          {/* Standee Action Buttons: Download, Share, Print, Test */}
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

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={handlePrintStandee}
              >
                <Printer size={14} /> Print Standee
              </button>

              <a
                href={feedbackUrl}
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
              <Wifi size={14} /> {showUrlEdit ? 'Cancel URL Change' : 'Change Feedback URL'}
            </button>
          </div>

          <div style={{ marginTop: '12px', fontSize: '0.68rem', color: '#64748B', lineHeight: 1.5 }}>
            💡 Paste on gym mirrors, water cooler, and reception so members can give instant feedback from Google Lens.
          </div>
        </div>

        {/* Column 2: Live Feed of Customer Reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Filter Bar */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9CA3AF', marginRight: '4px' }}>
                <Filter size={12} style={{ display: 'inline', marginRight: '4px' }} /> Rating:
              </span>

              {['ALL', '5', '4', '3', '2', '1'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStarFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: starFilter === st ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                    background: starFilter === st ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: starFilter === st ? '#F59E0B' : '#9CA3AF',
                    cursor: 'pointer'
                  }}
                >
                  {st === 'ALL' ? 'All' : `${st} ★`}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
              Showing {filteredFeedbacks.length} of {totalCount}
            </div>
          </div>

          {/* List of Reviews */}
          {filteredFeedbacks.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#9CA3AF' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F9FAFB' }}>No reviews found for this filter</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Scan the QR code to submit a new test feedback.</div>
            </div>
          ) : (
            filteredFeedbacks.map(f => {
              const isAcknowledged = f.status === 'ACKNOWLEDGED';
              const isReplying = activeReplyId === f.id;

              return (
                <div
                  key={f.id}
                  className="glass-card"
                  style={{
                    padding: '18px 20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Review Header: Member Name, Stars, Date */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(59, 130, 246, 0.2))',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#F59E0B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.85rem'
                      }}>
                        {f.name ? f.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#F9FAFB' }}>
                          {f.name || 'Gym Member (Anonymous)'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {f.phone && <span>📞 {f.phone}</span>}
                          <span>📅 {new Date(f.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Star Rating Badge */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '999px',
                        padding: '3px 10px',
                        color: '#F59E0B',
                        fontSize: '0.78rem',
                        fontWeight: 800
                      }}>
                        {[...Array(Number(f.rating) || 5)].map((_, i) => (
                          <Star key={i} size={13} fill="#F59E0B" />
                        ))}
                      </div>

                      {/* Status Badge */}
                      {isAcknowledged ? (
                        <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }}>
                          ✓ Acknowledged
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 700 }}>
                          ⚡ New Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Pill & Detailed Sub-scores */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.7rem', color: '#9CA3AF' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0', fontWeight: 700 }}>
                      🏷️ {f.category}
                    </span>
                    <span>• Cleanliness: <strong>{f.cleanliness_rating || 5}★</strong></span>
                    <span>• Machines: <strong>{f.equipment_rating || 5}★</strong></span>
                    <span>• Trainer: <strong>{f.trainer_rating || 5}★</strong></span>
                  </div>

                  {/* Review Comments */}
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#E2E8F0',
                    lineHeight: 1.5,
                    margin: '2px 0 6px 0',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '10px 12px',
                    borderRadius: '8px'
                  }}>
                    "{f.comments || 'No written comment'}"
                  </p>

                  {/* Owner Response / Notes if present */}
                  {f.owner_notes && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      borderLeft: '3px solid #F59E0B',
                      padding: '8px 12px',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '0.78rem',
                      color: '#FDE68A'
                    }}>
                      <strong>Gym Owner Note:</strong> {f.owner_notes}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    {!isAcknowledged ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800, gap: '4px' }}
                          onClick={() => handleAcknowledge(f.id)}
                        >
                          <Check size={14} /> Acknowledge Review
                        </button>

                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => {
                            setActiveReplyId(isReplying ? null : f.id);
                            setReplyText('');
                          }}
                        >
                          {isReplying ? 'Cancel' : '+ Add Note'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Reviewed & Recorded in System
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(f.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Delete review"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Reply Note Input Field */}
                  {isReplying && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Type an internal note or owner reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{ fontSize: '0.78rem', padding: '6px 10px', flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => handleAcknowledge(f.id)}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
